import { DataSource } from "typeorm"
import dataBaseSourse from "../../data-source"
import app from "../../app"
import request from "supertest"
import { myUserAdminCreate, myUserAdminLogin, myUserCreate, myUserLogin, myUserUpdate } from "../mock/user"

let token: any;
let tokenIsAdmin: any;

describe("Testa a atualização dos usuários", () => {
    let connection: DataSource

    beforeAll( async () => {
        await dataBaseSourse.initialize()
        .then((res) => (connection = res))
        .catch((err) => console.log(err))

        await request(app).post("/users").send(myUserAdminCreate)
        await request(app).post("/users").send(myUserCreate)

        tokenIsAdmin = await request(app).post("/users/login").send(myUserAdminLogin)
        token = await request(app).post("/users/login").send(myUserLogin)

    })

    afterAll(async () => {
        await connection.destroy()
    })

    test("Atualiza com sucesso o usuário", async () => {
        const myToken = tokenIsAdmin.body.tokenUser

        const response = await request(app).patch(`/users/${1}`).set("Authorization", `${myToken}`).send(myUserUpdate)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({id: 1, ...myUserUpdate}))
    })

    test("Usuário não é admin", async () => {
        const myToken = token.body.tokenUser

        const response = await request(app).patch(`/users/${1}`).set("Authorization", `${myToken}`).send({name: "Novo nome"})

        expect(response.status).toBe(401)
        expect(response.body).toEqual({"message":"Não autorizado"})
    })

    test("Usuário sem token", async () => {
        const myToken = ""

        const response = await request(app).patch(`/users/${1}`).set("Authorization", `${myToken}`).send({name: "Novo nome"})

        expect(response.status).toBe(401)
        expect(response.body).toEqual({"message":"Missing Authorization Token"})
    })

    test("Atualiza usuário que não existe", async () => {
        const myToken = tokenIsAdmin.body.tokenUser

        const response = await request(app).patch(`/users/${999}`).set("Authorization", `${myToken}`).send(myUserUpdate)

        expect(response.status).toBe(404)
        expect(response.body).toEqual({"message": "usuário não encontrado"})
    })
})