import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { Role } from 'src/auth/role.decorator';


@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService:UsersService
    ){}

 
    @Mutation(returns => CreateAccountOutput)
    async createAccount(@Args('input') createAccountInput: CreateAccountInput ):Promise<CreateAccountOutput>{
       return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    async login(@Args('input') loginInput:LoginInput):Promise<LoginOutput> {
       return this.usersService.login(loginInput);
    }

    @Query(returns => User)
    @Role(['Any'])
    me(@AuthUser() authUser: User){
      return authUser;
    }


    @Query(returns => UserProfileOutput)
    @Role(['Any'])
    async userProfile(@Args() userProfileInput: UserProfileInput):Promise<UserProfileOutput>{
        return this.usersService.findById(userProfileInput.userId);
    }

    @Mutation(returns => EditProfileOutput)
    @Role(['Any'])
    async editProfile(@AuthUser() authUser:User, @Args('input') editProfileInput:EditProfileInput ):Promise<EditProfileOutput>{
        return this.usersService.editProfile(authUser.id,editProfileInput);
    }

    @Mutation(returns => VerifyEmailOutput)
    async verifyEmail(@Args('input') {code}:VerifyEmailInput):Promise<VerifyEmailOutput>{
        return this.usersService.verifyEmail(code);
    }

}