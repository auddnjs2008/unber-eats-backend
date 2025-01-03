import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';


global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({success:'success'})
})) as jest.Mock;


const testUser = {
  email :  'new3@naver.com',
  password :'auddnjs152!'
}


const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let jwtToken :string;
  let verificatinosRepository:Repository<Verification>;


  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query:string) => baseTest().send({query});
  const privateTest = (query:string) => baseTest().set('X-JWT',jwtToken).send({query});


  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificatinosRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification))
    await app.init();
  });

  afterAll(async () => {
    const dataSource : DataSource = new DataSource({
      type:'postgres',
      host:process.env.DB_HOST,
      port:+process.env.DB_PORT,
      username:process.env.DB_USERNAME,
      password:process.env.DB_PASSWORD,
      database:process.env.DB_NAME,
    });
    const connection:DataSource = await dataSource.initialize();
    await connection.dropDatabase(); // database delete
    await connection.destroy();
    await app.close();
  })

  describe("createAccount",()=>{
   
      it('should create account', () => {
         return( 
         publicTest(`
          mutation{
            createAccount(input:
              {email:"${testUser.email}",password:"${testUser.password}",role:Owner}
            ){
              ok
              error
             }
            }         
          `).expect(200).expect(async res => {
            expect(res.body.data.createAccount.ok).toBe(true);
            expect(res.body.data.createAccount.error).toBe(null);
         })
        )
      })


      it('should fail if account already exists', () => {
        return publicTest(`
          mutation{
            createAccount(input:
              {email:"${testUser.email}",password:"${testUser.password}",role:Owner}
            ){
              ok
              error
             }
            }         
          `).expect(200)
         .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(false);
            expect(res.body.data.createAccount.error).toEqual(expect.any(String));
         })



      });

  }); 

  describe("login", () => {
    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        
        });
    });

    it('should not be able to login with wrong credentials',() => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"xxx",
            }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    })


  }); 

  describe("userProfile",()=>{
    let userId:number;
    
    beforeAll(async () => {
      const [user] = (await usersRepository.find());
      userId = user.id;
    })
    it('should see a user profile',() => {
      return privateTest(`
        {
          userProfile(userId:${userId}){
            ok
            error
            user {
              id
            }
          }
        }
        `).expect(200)
      .expect(res => {
        const {body:{data: {userProfile:{ok,error,user:{id}}}}} = res;
        expect(ok).toBe(true)
        expect(error).toBe(null)
        expect(id).toBe(userId);
      })

    });
    it('should not find a profile',() => {
      return privateTest(`
        {
          userProfile(userId:666){
            ok
            error
            user {
              id
            }
          }
        }
        `).expect(200)
      .expect(res => {
        const {body:{data: {userProfile:{ok,error,user}}}} = res;
        expect(ok).toBe(false)
        expect(error).toBe(' User Not Found')
        expect(user).toBe(null)
      })


    });

  });  
  
  
  describe('me', () => {
    it('should find my profile', () => {
      return privateTest( `
        {
          me {
            email
          }
        }
      `).expect(200)
      .expect(res => {
        const {body: {data : {me: {email}}}} = res;
        expect(email).toBe(testUser.email);

      })
    });

    it('should not allow logged out user', () => {
      return publicTest( `
        {
          me {
            email
          }
        }
      `).expect(200)
      .expect(res => {
        const { body : {errors}} = res;
        const [ error] = errors;
        expect(error.message).toBe('Forbidden resource');
      })
    })


  });
  
  describe("editProfile", () => {
    const NEW_EMAIL = 'kmw222@new.com';
    it('should change email',() => {
      return privateTest(`
          mutation {
              editProfile(input:{
                email: "${NEW_EMAIL}"
              }) {
                ok
                error
              }
            }
        
        `).expect(200)
      .expect(res=> {
        const {body :{data: {editProfile :{ok,error}}}} = res;
        expect(ok).toBe(true)
        expect(error).toBe(null)
      })
    });

    it('should have new email', () => {
     return (
        privateTest( `
          {
            me {
              email
            }
          }
        `).expect(200)
      .expect(res => {
        const {body: {data : {me: {email}}}} = res;
        expect(email).toBe(NEW_EMAIL);
      })
    )
      })
  });


  describe("verifyEmail", () => {
    let verificationCode:string;
    beforeAll(async () => {
      const [verification] = await verificatinosRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email',() => {
      return publicTest(`
           mutation {
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }
        `).expect(200).expect(res => {
        const {body : {data : {verifyEmail : {ok, error}}}} = res;
        expect(ok).toBe(true);
        expect(error).toBe(null);
      })
    })

    it('should fail on wrong verification code',() => {
      return publicTest(`
           mutation {
            verifyEmail(input:{
              code:"xxx"
            }){
              ok
              error
            }
          }
        `).expect(200).expect(res => {
        const {body : {data : {verifyEmail : {ok, error}}}} = res;
        expect(ok).toBe(false);
        expect(error).toBe('Verification not found.');
      })



    });


  });

});
