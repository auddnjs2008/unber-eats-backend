import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
    findOne : jest.fn(),
    save : jest.fn(),
    create : jest.fn(),
    findOneOrFail:jest.fn(),
    delete:jest.fn(),
    exists:jest.fn()
})

const mockJwtService = () => ({
    sign:jest.fn(() => 'signed-token-baby'),
    verify:jest.fn()
})

const mockMailService = () => ({
    sendVerificationEmail : jest.fn()
})

type MockRepository<T=any> = Partial<Record<keyof Repository<T>,jest.Mock>>;

describe("User Service",() => {

    let service : UsersService;
    let userRepository: MockRepository<User>;
    let verificationRepository:MockRepository<Verification>;
    let mailService:MailService;
    let jwtService:JwtService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers:[
                UsersService,
                {
                    provide:getRepositoryToken(User), useValue: mockRepository()
                },
                {
                    provide:getRepositoryToken(Verification), useValue: mockRepository()
                },
                {
                    provide:JwtService, useValue: mockJwtService()
                },
                {
                    provide:MailService, useValue: mockMailService()
                },

            ]
        }).compile();
        service =  module.get<UsersService>(UsersService);
        mailService = module.get<MailService>(MailService);
        jwtService = module.get<JwtService>(JwtService);
        userRepository = module.get(getRepositoryToken(User));
        verificationRepository = module.get(getRepositoryToken(Verification));
    })

    it('be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAccount',() => {
        const createAccountArgs= {
            email:'',
            password:'',
            role:UserRole.Client
        }

        it('should fail if user exists',async () => {
            userRepository.findOne?.mockResolvedValue({
                id:1,
                email:''
            });
            const result = await service.createAccount(createAccountArgs);

            expect(result).toMatchObject({ok:false,error:"There is a user with that email already"});

        });

        it('should create a new user', async () => {
            userRepository.findOne.mockResolvedValue(undefined);
            userRepository.create.mockReturnValue(createAccountArgs);
            userRepository.save.mockResolvedValue(createAccountArgs);
            verificationRepository.create.mockReturnValue({user:createAccountArgs});
            verificationRepository.save.mockResolvedValue({code:'code'});

            const result =  await service.createAccount(createAccountArgs);
            expect(userRepository.create).toHaveBeenCalledTimes(1);
            expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);

            
            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);

            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({user:createAccountArgs});

            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith({user:createAccountArgs});

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(expect.any(String),expect.any(String));

            expect(result).toEqual({ok:true});


        })

        it('should failed on exception', async () => {
            userRepository.findOne.mockRejectedValue(new Error(''));
            const result = await service.createAccount(createAccountArgs)
            expect(result).toEqual({ok:false,error:"Couldn't create account"});
        })
    })


    describe('login',()=>{
        const loginArgs = {
            email:'bs@email.com',
            password:'bs.password'
        };

        it('shoud fail if user does not exist', async () => {
            userRepository.findOne.mockResolvedValue(null);

            const result = await service.login(loginArgs);

            expect(userRepository.findOne).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
            expect(result).toEqual({
                ok:false,
                error:'User not found'
            })

        })

        it('should fail if the password is wrong', async () => {
            const mockedUser = {
                id:1,
                checkPassword: jest.fn(()=>Promise.resolve(false))
            }
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual({ ok: false, error: 'Wrong password' });
        })


        it('should return token if password correct', async () => {
            const mockedUser = {
                id:1,
                checkPassword: jest.fn(()=>Promise.resolve(true))
            }
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({ ok: true, token: 'signed-token-baby' });
        });

        it('should fail on exception', async () => {
            userRepository.findOne.mockRejectedValue(new Error(''));
            const result = await service.login(loginArgs);
            expect(result).toEqual( {
                ok:false,
                error:'Cant log user in'
            });
        })

    });

    describe('findById',()=>{
        const findByIdArgs = {
            id:1
        }

        it('should find an existing user', async () => {
            userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
            const result = await service.findById(1);
            expect(result).toEqual({ok:true, user:findByIdArgs});
        })

        it('should fail if no user is found', async () => {
            userRepository.findOneOrFail.mockRejectedValue(new Error(''));
            const result = await service.findById(1);
            expect(result).toEqual({ok:false, error:' User Not Found'});
        })


    });
    

    describe('editProfile',() => {

        it('should change eamil', async () => {

            const oldUser = {
                email:"b@old.com",
                verified:true
            };

            const editProfileArgs = {
                userId:1,
                input:{email:'bs@new.com'},
            }

            const newVerification = {
                code:'code'
            }

            const newUser = {
                verified:false,
                email:editProfileArgs.input.email
            };

            userRepository.findOne.mockResolvedValue(oldUser);
            verificationRepository.create.mockReturnValue(newVerification);
            verificationRepository.save.mockResolvedValue(newVerification);


            await service.editProfile(editProfileArgs.userId,editProfileArgs.input);
            expect(userRepository.findOne).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith({where:{id:editProfileArgs.userId}});

            expect(verificationRepository.create).toHaveBeenCalledWith({user:newUser});
            expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(newUser.email, newVerification.code);


        })

        it('should change Password' , async () => {
            const editProfileArgs = {
                userId:1,
                input: {password:'newPassword'}
            };
            userRepository.findOne.mockResolvedValue({password:'old'});
            const result = await service.editProfile(editProfileArgs.userId,editProfileArgs.input );
            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
            expect(result).toEqual({ok:true});
        })

        it('should fail on exception', async () => {
            userRepository.findOne.mockRejectedValue(new Error());
            const result = await service.editProfile(1,{email:"12"});
            expect(result).toEqual({ok:false, error :'Could not update profile'});
        })


    });



    describe("verifyEmail",() => {
        it('should verify email ', async ()=>{
            const mockedVerification = {
                user:{
                    verified:false
                },
                id:1
            }
            verificationRepository.findOne.mockResolvedValue(mockedVerification);

            const result = await service.verifyEmail('');

            expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
            expect(verificationRepository.findOne).toHaveBeenCalledWith(expect.any(Object));

            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith({verified:true});


            expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
            expect(verificationRepository.delete).toHaveBeenCalledWith(mockedVerification.id);
            expect(result).toEqual({ok:true});

        })

        it('should fail on verification not found',async ()=>{
            verificationRepository.findOne.mockResolvedValue(undefined);
            const result = await service.verifyEmail('');
            expect(result).toEqual({ok:false, error: 'Verification not found.'});


        })
        it('shoud fail on exception', async () => {
            verificationRepository.findOne.mockRejectedValue(new Error());
            const result = await service.verifyEmail('');
            expect(result).toEqual({ok:false, error: 'Could not verify email'});
        })


    });






})