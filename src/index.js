const express = require("express")
const { v4: uuidv4 } = require("uuid")

const app = express()

app.use(express.json())

const customers = []

function checkIsValidAccount(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find((customer) => customer.cpf === cpf)
    !customer && response.status(400).json({ error: "Customer not found!" })

    request.customer = customer

    return next()
}

function getBalanceAccount(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "deposit") {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)

    return balance
}

app.post("/account", (request, response) => {
    const { cpf, name } = request.body

    const isInvalidAccount = customers.some((customer) => customer.cpf === cpf)

    isInvalidAccount && response.status(400).json({ error: "Customer already exists!" })

    customers.push({
        cpf,
        name,
        id_account: uuidv4(),
        statement: [],
    })

    return response.status(201).send()
}) //!: request de envio do novo usuário para /account

app.get("/statement", checkIsValidAccount, (request, response) => {
    const { customer } = request

    return response.json(customer.statement)
}) //!: request de busca pelo CPF

app.post("/deposit", checkIsValidAccount, (request, response) => {
    const { description, amount } = request.body
    const { customer } = request

    const statementOPeration = {
        id: uuidv4(),
        amount,
        created_at: new Date(),
        description,
        type: "deposit",
    }

    customer.statement.push(statementOPeration)

    return response.status(201).send()
}) //!: request depósito em conta

app.post("/withdraw", checkIsValidAccount, (request, response) => {
    const { amount_withdraw } = request.body
    const { customer } = request

    const balance = getBalanceAccount(customer.statement)

    if (balance < amount_withdraw) {
        return response.status(400).json({ error: "Insufficient funds" })
    }

    const statementOPeration = {
        id_withdraw: uuidv4(),
        amount_withdraw,
        created_at: new Date(),
        type: "withdraw",
    }

    customer.statement.push(statementOPeration)

    return response.status(201).send()
}) //!: request saque em conta

app.get("/statement/date", checkIsValidAccount, (request, response) => {
    const { date } = request.query
    const { customer } = request

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter(
        (statement) =>
            statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    )

    return response.json(statement)
}) //!: request de busca por data

app.listen(4400)
console.log("Servidor operando!❣️")
