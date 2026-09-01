# SpendWise

A single-user personal finance tracker: money going out, money coming in, ceilings on
spending, and savings targets. One person's own money in Naira — there is no notion of
sharing, households, or multiple currencies.

## Language

**Transaction**:
A single outflow of money, always dated and always filed under exactly one Category.
Money arriving is never a Transaction — that is an Earning.
_Avoid_: expense, spend, payment, purchase

**Earning**:
Money arriving. Recorded separately from Transactions because it is never categorised
and never counted against a Budget.
_Avoid_: income, revenue, deposit, credit

**Category**:
The label a Transaction is filed under. The set is closed and defined by the app, not by
the user.
_Avoid_: tag, label, type, bucket

**Essential** / **Discretionary**:
The two kinds of Category. A Transaction inherits its kind from its Category rather than
being classified on its own, so the kind is a fact about the Category first.
_Avoid_: necessary, optional, wants/needs, fixed/variable

**Budget**:
A ceiling on spending in one Category. A user has at most one per Category — the pair is
unique — which is why a Budget is addressed by its Category rather than by an id.
_Avoid_: limit, cap, allowance, envelope

**Goal**:
A savings target: an amount aimed at, an amount reached so far, and optionally a date to
reach it by.
_Avoid_: target, savings pot, objective

**Deposit**:
An addition to the amount a Goal has reached. Neither a Transaction nor an Earning —
moving money toward a Goal is not spending it or receiving it.
_Avoid_: contribution, top-up, payment

**Impulse Blocker**:
A forced pause between deciding to record a Discretionary Transaction and it being
recorded, meant to interrupt an impulse purchase.
_Avoid_: cooldown, delay, confirmation

**Scan**:
Reading a receipt or invoice image to propose a Transaction. A Scan proposes; it never
records on its own.
_Avoid_: OCR, capture, import

**Audit**:
A generated commentary on one month's Transactions, Earnings and Budgets. Advisory only:
an Audit never changes stored data.
_Avoid_: report, analysis, review, insight
