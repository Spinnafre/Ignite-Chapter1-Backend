const express=require('express')
const {v4:uuid}=require('uuid')
const app=express()
const port=3333
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
const customers=[]

function verifyIfExistsAccount(req,res,next){
    const customer=customers.find(e=>e.cpf===req.headers.cpf)
    if(!customer){
        return res.status(400).json({msg:"Customer not found"})
    }
    req.customer=customer
    next()
}
function calcBalance(statement){
    const balance=statement.reduce((acc,next)=>{
        if(next.type==="credit"){
            return acc+=next.amount
        }
        return acc-=next.amount
    },0)
    return balance
}
app.post('/account',(req,res)=>{
    const {name,cpf}=req.body
    if(customers.some((e)=>e.cpf===cpf)){
        return res.status(400).json({msg:'User with cpf already exist'})
    }
    customers.push({
        id:uuid(),
        cpf,
        name,
        statement:[]
    })

    return res.status(201).json(customers)
})
app.get('/statement',verifyIfExistsAccount,(req,res)=>{
    const {customer}=req
    return res.json(customer.statement)
})
app.get('/customers',verifyIfExistsAccount,(req,res)=>{
    return res.json(customers)
})
app.put('/account',verifyIfExistsAccount,(req,res)=>{
    const {name}=req.body
    const {customer}=req
    customer.name=name
    return res.json(customer)
})
app.delete('/account',verifyIfExistsAccount,(req,res)=>{
    const {customer}=req
    customers.splice(customer,1)
    return res.json(customers)
})

app.post('/deposit',verifyIfExistsAccount,(req,res)=>{
    const {description,amount}=req.body
    const newStatement={
        description,
        amount,
        created_at:new Date(),
        type:"credit"
    }
    const customer=req.customer
    customer.statement.push(newStatement)
    return res.status(201).json(customer.statement)
})
// Sacar
app.post('/withdraw',verifyIfExistsAccount,(req,res)=>{
    const {amount}=req.body
    const {customer}=req
    const total=calcBalance(customer.statement)
    if(total<amount){
        return res.status(400).json({msg:"Insufficient founds"})
    }
    customer.statement.push({
        amount,
        created_at:new Date(),
        type:"debit"
    })
    return res.status(201).json(customer.statement)
})
app.get('/statement/date',verifyIfExistsAccount,(req,res)=>{
    const {customer}=req
    const {date}=req.query
    const filtered=customer.statement.filter(statment=>{
        return statment.created_at.toDateString() === new Date(date + " 00:00").toDateString()
    })
    return res.status(201).json(filtered)
})
app.get('/balance',verifyIfExistsAccount,(req,res)=>{
    const {customer}=req
    const balance=calcBalance(customer.statement)
    return res.status(201).json(balance)
})



app.listen(port,()=>{
    console.log(`Rodando em http://localhost:${port}`)
})