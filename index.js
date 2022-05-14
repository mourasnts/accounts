const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs");

var login = false

inicio()


//Iniciar aplicacao
function inicio () {

	if (!fs.existsSync("accounts")) {
		fs.mkdirSync("accounts")
	}

	sigin();
}


//Menu de login
function sigin () {

	console.clear()
	setLogin(false)

	inquirer.prompt([{
		type: "list",
		name: "action",
		message: "Seja bem vindo! Selecione a opcao desejada.\r\n",
		choices: [
			"Criar conta",
			"Entrar"
		]
	}]).then((choice) => {

		const action = choice["action"]
		const actions = {
			"Criar conta": createAccount,
			"Entrar": entrar
		}

		console.clear()
		return actions[action]()

	}).catch((err) => console.log(err))

}

//Menu de operacoes
function menu () {

	if(!login){
		sigin()
	}

	inquirer.prompt([{
		type: "list",
		name: "action",
		message: "O que deseja fazer?\r\n",
		choices: [
			"Consultar saldo",
			"Deposito",
			"Saque",
			"Transferencia",
			"Voltar"
		]
	}]).then((choice) => {

		const action = choice["action"]
		const actions = {
			"Consultar saldo": consultarSaldo,
			"Voltar": sigin,
			"Deposito": deposito,
			"Saque": saque,
			"Transferencia": transferencia
		}

		return actions[action]()

	}).catch((err) => console.log(err))

}


//Cadastro de usuario
function createAccount () {

	console.log(chalk.bgWhite.black("Criar conta\r\m"))

	inquirer.prompt([
		{
			name: "user",
			message: "Digite um nome para ser seu suario: "
		},
		{
			name: "senha",
			message: "Cadastre uma senha: "
		}
	]).then((respostas) => {

		const user = respostas["user"]
		const senha = respostas["senha"]


		if (verificaUser(user)) {
			console.clear()
			console.log(chalk.bgRed.black("Usuario ja existe."))
			return createAccount()
		}


 		fs.writeFileSync(`accounts/${user}.json`, `{"saldo": 0.00, "senha": "${senha}"}`)

		console.clear()
		console.log(chalk.bgGreen.black("Usuario cadastrado!\r\n"))

		setLogin(user)
		return menu()

	}).catch((err) => console.log(err))

}

//Login de usuario
function entrar () {

	console.log(chalk.bgWhite.black("Entrar\r\n"))

	inquirer.prompt([
		{name: "user", message: "Usuario: "},
		{name: "senha", message: "Senha: "}
	]).then((respostas) => {

		const user = respostas["user"]
		const senha = respostas["senha"]


		if(!verificaLogin(user, senha)){
			console.clear()
			console.log(chalk.bgRed.black("Login invalido.\r\n"))
			return entrar()
		}


		setLogin(user)

		console.clear()
		console.log(chalk.bgGreen.white("Usuario logado!\r\n"))

		return menu()

	}).catch((err) => console.log(err))

}


//Funcoes
function consultarSaldo() {

	const data = getData(login)
	const saldo = parseFloat(data.saldo)

	console.clear()
	console.log(chalk.bgWhite.black(`Seu saldo e de: R$${saldo}\r\n`))

	return menu()
}

function deposito () {

	inquirer.prompt([{
		name: "deposito",
		message: "Quanto deseja depositar? "
	}]).then((resposta) => {

		const data = getData(login)
		const saldoInicial = data.saldo
		data.saldo = (parseFloat(saldoInicial) + parseFloat(resposta.deposito)).toFixed(2)

		fs.writeFileSync(`accounts/${login}.json`, JSON.stringify(data))

		console.clear()
 		console.log(chalk.bgGreen.white("Depositado!\r\n"))

		return menu()

	}).catch((err) => console.log(err))

}

function saque (saque) {

        inquirer.prompt([{
                name: "saque",
                message: "Quanto deseja sacar? "
        }]).then((resposta) => {

		const data = getData(login)
		const saldoInicial = data.saldo
		data.saldo = (parseFloat(saldoInicial) - parseFloat(resposta.saque)).toFixed(2)

		if (saque > saldoInicial) {
			console.clear()
			console.log(chalk.bgRed.black("Saldo insuficiente!\r\n"))
			return menu()
		}

                fs.writeFileSync(`accounts/${login}.json`, JSON.stringify(data))

		console.clear()
                console.log(chalk.bgGreen.white("Sacado!\r\n"))

                return menu()

        }).catch((err) => console.log(err))

}

function transferencia () {

	inquirer.prompt([
		{ name: "conta", message: "Para quem deseja transferir? "},
		{ name: "amount", message: "Quanto deseja transferir? "}
	]).then((respostas) => {


		const data = getData(login)
		const userDestino = respostas.conta
                const amount = respostas.amount
                const saldoInicial = data.saldo

		if (!amount) {
			console.clear()
			console.log(chalk.bgRed.black("Cade o dinheiro mao de vaca?\r\n"))
			return menu()
		}

		if (amount > saldoInicial) {
                        console.clear()
                        console.log(chalk.bgRed.black("Saldo insuficiente!\r\n"))
                        return menu()
                }

		if(userDestino == login) {
			console.clear()
			console.log(chalk.bgRed.black("Ops! nao podemis transferir para a sua propia conta.\r\n"))
			return menu()
		}

		if (!verificaUser(userDestino)) {
			console.clear()
			console.log(chalk.bgRed.black("Voce precisa selecionar uma conta valida.\r\n"))
			return menu()
		}

                const dataDestino = getData(userDestino)
                const saldoInicialDestino = dataDestino.saldo

		data.saldo = (parseFloat(saldoInicial) - parseFloat(amount)).toFixed(2)
		dataDestino.saldo = (parseFloat(saldoInicialDestino) + parseFloat(amount)).toFixed(2)


                fs.writeFileSync(`accounts/${login}.json`, JSON.stringify(data))
                fs.writeFileSync(`accounts/${userDestino}.json`, JSON.stringify(dataDestino))

		console.clear()
		console.log(chalk.bgGreen.white("Transferencia realizada!\r\n"))
		menu()

	}).catch((err) => console.log(err))

}


//Verificacoes
function verificaUser (user) {

	console.log(JSON.stringify({user: user}))
	if (!user){
		return false
	}
	if (user == "") {
		return false
	}
	if (!fs.existsSync(`accounts/${user}.json`)) {
		return false;
	}
	return true;

}

function verificaLogin (user, senha) {

	if (!verificaUser(user)) {
		return false;
	}

	const data = getData(user)
	if (!(senha == data.senha)) {
		console.clear()
		console.log(chalk.bgRed.black("Login invalido\r\n"))
		return false
	}
	return true
}


//Consulta
function getData(user) {
	const accountJSON = fs.readFileSync(`accounts/${user}.json`, {encoding: 'utf8', flag: 'r',})
	return JSON.parse(accountJSON)
}


//Logar/Deslogar
function setLogin(user) {
	login = user
}
