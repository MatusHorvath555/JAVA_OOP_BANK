# OOP Bank – JavaScript

A small banking system written in vanilla JavaScript to practise object-oriented programming.
No frameworks, no libraries – just ES6 classes, async/await and the browser.

> Code identifiers and comments are in Slovak (`ucet` = account, `vklad` = deposit, `vyber` = withdrawal, `prevod` = transfer).

## Features

- **Accounts with auto-incremented IDs**, managed by a central `BANK` class
- **Deposits and withdrawals** protected by PIN and a **daily withdrawal limit**
- **Transfers between accounts** with balance and amount validation
- **Transaction history** on every account (type, amount, balance after, timestamp)
- **Savings account** with interest, **credit account** with an overdraft limit, **sub-account** linked to a main account
- **Live currency conversion** (EUR → USD / GBP / CZK) via [open.er-api.com](https://open.er-api.com) using `async/await` and `try/catch`
- **Bank-wide statistics** with array methods – total assets (`reduce`), accounts above a threshold (`filter`), owner names (`map`)
- **Saving to `localStorage`**

## Class design

```
BANK                    manages accounts, transfers, statistics, persistence
Account                 base account: PIN, daily limit, deposit, withdrawal, history
├── SporiaciUcet        savings account – adds interest (pripisUrok)
├── KreditnyUcet        credit account – overrides vyber() to allow overdraft up to a limit
└── PodUcet             sub-account – sends money back to its main account
```

OOP concepts used: encapsulation of account state, inheritance (`extends` / `super`),
method overriding (polymorphic `vyber()`), composition (`PodUcet` holds a reference to its main account).

## Tech

HTML · JavaScript (ES6 classes, async/await, Fetch API, DOM events, localStorage)

## How to run

1. Clone the repository
2. Open `index.html` in a browser
3. Open DevTools → Console to see the bank log

## Roadmap – v2

- [ ] Load data back from `localStorage` and rebuild class instances after page refresh
- [ ] Reuse `vyber()` / `vklad()` inside `prevod()` so PIN, daily limit and overdraft rules apply to transfers too
- [ ] Store money as integer cents to avoid floating-point rounding errors
- [ ] Reset the daily limit each day, record sub-account transfers in history
- [ ] Hash PINs instead of storing them in plain text
- [ ] Move the logic to a **PHP + MySQL backend** (OOP classes → database tables, REST API) with the current page as the frontend
