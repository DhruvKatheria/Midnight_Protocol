from pyteal import *

def approval_program():
    SPONSOR = Bytes("sponsor")
    AMOUNT = Bytes("amount")
    STATUS = Bytes("status") # 1=open, 2=submitted, 3=approved, 4=disputed, 5=refunded, 6=refunded(expired)
    BRIEF_HASH = Bytes("brief_hash")
    DEADLINE = Bytes("deadline")
    CONTRIBUTOR = Bytes("contributor")
    WORK_HASH = Bytes("work_hash")
    VAL1 = Bytes("val1")
    VAL2 = Bytes("val2")
    VAL3 = Bytes("val3")
    VOTES_APPROVE = Bytes("votes_approve")
    VOTES_REJECT = Bytes("votes_reject")

    on_create = Seq([
        App.globalPut(STATUS, Int(0)), # Uninitialized
        Return(Int(1))
    ])

    on_lock = Seq([
        Assert(App.globalGet(STATUS) == Int(0)),
        Assert(Txn.application_args.length() == Int(3)), # lock, brief_hash, deadline
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        App.globalPut(SPONSOR, Txn.sender()),
        App.globalPut(BRIEF_HASH, Txn.application_args[1]),
        App.globalPut(DEADLINE, Btoi(Txn.application_args[2])),
        App.globalPut(AMOUNT, Gtxn[0].amount()),
        App.globalPut(STATUS, Int(1)),
        Return(Int(1))
    ])

    on_submit = Seq([
        Assert(App.globalGet(STATUS) == Int(1)),
        Assert(Global.latest_timestamp() < App.globalGet(DEADLINE)),
        Assert(Txn.application_args.length() == Int(2)), # submit, work_hash
        App.globalPut(CONTRIBUTOR, Txn.sender()),
        App.globalPut(WORK_HASH, Txn.application_args[1]),
        App.globalPut(STATUS, Int(2)),
        Return(Int(1))
    ])

    on_approve = Seq([
        Assert(Txn.sender() == App.globalGet(SPONSOR)),
        Assert(App.globalGet(STATUS) == Int(2)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(CONTRIBUTOR),
            TxnField.amount: App.globalGet(AMOUNT),
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(STATUS, Int(3)),
        Return(Int(1))
    ])

    on_dispute = Seq([
        Assert(Txn.sender() == App.globalGet(SPONSOR)),
        Assert(App.globalGet(STATUS) == Int(2)),
        Assert(Txn.application_args.length() == Int(4)), # dispute, val1, val2, val3
        App.globalPut(VAL1, Txn.application_args[1]),
        App.globalPut(VAL2, Txn.application_args[2]),
        App.globalPut(VAL3, Txn.application_args[3]),
        App.globalPut(VOTES_APPROVE, Int(0)),
        App.globalPut(VOTES_REJECT, Int(0)),
        App.globalPut(STATUS, Int(4)),
        Return(Int(1))
    ])

    on_vote = Seq([
        Assert(App.globalGet(STATUS) == Int(4)),
        Assert(
            Or(
                Txn.sender() == App.globalGet(VAL1),
                Txn.sender() == App.globalGet(VAL2),
                Txn.sender() == App.globalGet(VAL3)
            )
        ),
        Assert(Txn.application_args.length() == Int(2)), # vote, approve(1/0)
        If(Btoi(Txn.application_args[1]) == Int(1))
        .Then(App.globalPut(VOTES_APPROVE, App.globalGet(VOTES_APPROVE) + Int(1)))
        .Else(App.globalPut(VOTES_REJECT, App.globalGet(VOTES_REJECT) + Int(1))),
        Return(Int(1))
    ])

    on_execute = Seq([
        Assert(App.globalGet(STATUS) == Int(4)),
        If(App.globalGet(VOTES_APPROVE) >= Int(2))
        .Then(Seq([
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: App.globalGet(CONTRIBUTOR),
                TxnField.amount: App.globalGet(AMOUNT),
                TxnField.fee: Int(0)
            }),
            InnerTxnBuilder.Submit(),
            App.globalPut(STATUS, Int(3))
        ]))
        .ElseIf(App.globalGet(VOTES_REJECT) >= Int(2))
        .Then(Seq([
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: App.globalGet(SPONSOR),
                TxnField.amount: App.globalGet(AMOUNT),
                TxnField.fee: Int(0)
            }),
            InnerTxnBuilder.Submit(),
            App.globalPut(STATUS, Int(5))
        ]))
        .Else(Reject()), # Keep waiting if not enough votes
        Return(Int(1))
    ])

    on_refund = Seq([
        Assert(App.globalGet(STATUS) == Int(1)),
        Assert(Txn.sender() == App.globalGet(SPONSOR)),
        Assert(Global.latest_timestamp() >= App.globalGet(DEADLINE)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(SPONSOR),
            TxnField.amount: App.globalGet(AMOUNT),
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(STATUS, Int(6)),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.application_args[0] == Bytes("lock"), on_lock],
        [Txn.application_args[0] == Bytes("submit"), on_submit],
        [Txn.application_args[0] == Bytes("approve"), on_approve],
        [Txn.application_args[0] == Bytes("dispute"), on_dispute],
        [Txn.application_args[0] == Bytes("vote"), on_vote],
        [Txn.application_args[0] == Bytes("execute"), on_execute],
        [Txn.application_args[0] == Bytes("refund"), on_refund]
    )

    return program


def clear_program():
    return Return(Int(1))


if __name__ == "__main__":
    with open("artifacts/approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=6))

    with open("artifacts/clear.teal", "w") as f:
        f.write(compileTeal(clear_program(), mode=Mode.Application, version=6))

    print("✅ Contract compiled successfully to artifacts/approval.teal and artifacts/clear.teal")