import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly users:Repository<User>,
        @InjectRepository(Verification) private readonly verifications:Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService:MailService
    ){}


    async createAccount({email,password,role}:CreateAccountInput):Promise<CreateAccountOutput>{
        try{
            const exists = await this.users.findOne({where:{email}});
            if(exists){
                return {ok:false,error:"There is a user with that email already"};
            }
            const user = await this.users.save(this.users.create({email,password,role}));
            const verification = await this.verifications.save(this.verifications.create({
                user
            }));
            this.mailService.sendVerificationEmail(user.email,verification.code);
            return {ok:true};
        }catch(e){
            // make error
            return {ok:false,error:"Couldn't create account"};
        }
        
        
        // check new user
        // create user & hash the password
        
    }

    async login({email,password}:LoginInput): Promise<LoginOutput>{
        //find user with the email
        // check if the password is correct
        // make a JWT and give it to tue user

        try{
            const user = await this.users.findOne({where:{email},select:['id','password']});
        
            if(!user){
                return {
                    ok:false,
                    error:'User not found'
                }
            }
            const passwordCorrect = await user.checkPassword(password);
            if(!passwordCorrect){
                return{
                    ok:false,
                    error:'Wrong password'
                }
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok:true,
                token
            }
        }catch(error){
            return {
                ok:false,
                error:'Cant log user in'
            }
        }
    }

    async findById(id:number):Promise<UserProfileOutput>{
        try{
            const user = await this.users.findOneOrFail({where:{id}});
            return {
                ok: true,
                user
            }
        }catch(error){
            return {ok:false, error:' User Not Found'};
        }
    }

    async editProfile(userId:number,{email,password}:EditProfileInput):Promise<EditProfileOutput>{
       try{
            const user = await this.users.findOne({where:{id:userId}});
            if(email){
                const exist = await this.users.exists({where:{email,id:Not(userId)}});
                if(exist){
                    return {ok: false, error :'The other user already has the same email'}
                }
                await this.verifications.delete({user:{id:user.id}})
                user.email = email;
                user.verified = false;
                const verification = await this.verifications.save(this.verifications.create({user}));
                this.mailService.sendVerificationEmail(user.email,verification.code);

            }
            if(password){
                user.password = password;
            }

            await this.users.save(user);

            return {
                ok:true,
            }
       }catch(error){
        console.log(error);
            return {ok:false, error :'Could not update profile'};
       }
    }

    async verifyEmail(code:string):Promise<VerifyEmailOutput>{
        try{
            const verification = await this.verifications.findOne({where:{code},relations:['user']});

            if(verification){
                verification.user.verified = true;
               
                this.users.save(verification.user);
                await this.verifications.delete(verification.id);
                return {ok:true};
            }
    
            return {ok:false, error: 'Verification not found.'};
        }catch(error){
            return  {ok:false, error: 'Could not verify email'};
        }
    }

}