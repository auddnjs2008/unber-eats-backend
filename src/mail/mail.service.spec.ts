import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from 'src/common/common.constants';


const TEST_DOMAIN = 'test-domain';

describe('MailService',()=>{
    let service:MailService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: 
            [MailService,
            {
                provide:CONFIG_OPTIONS,
                useValue:{
                    apiKey:'test-apiKey',
                    domain:'test-domain',
                    fromEmail:'test-fromEmail'
                }
            }
        ]
        }).compile();
        service = module.get<MailService>(MailService);


    })



    it('should be defined',() => {
        expect(service).toBeDefined();
    })


    describe('sendVerificationEmail', () => {
        it('should call sendEmail', () => {
            const sendVerificationEmialArgs = {
                email:'email',
                code:'code'
            };

            jest.spyOn(service,'sendEmail').mockImplementation(async() => {
                return true;
            });

            service.sendVerificationEmail(sendVerificationEmialArgs.email,sendVerificationEmialArgs.code);
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith("Verify Your Email",'number-eats template',
            [{key:"code",value:sendVerificationEmialArgs.code},{key:'username',value:sendVerificationEmialArgs.email}] )

        })
    })

    describe('sendEmail',() => {
        it('sends email', async () => {
            global.fetch = jest.fn(() => Promise.resolve({
                json: () => Promise.resolve({success:'success'})
            })) as jest.Mock;

            global.FormData.prototype.append = jest.fn(()=>{});


            const ok = await service.sendEmail('','',[]);
            // const formSpy = jest.spyOn(FormData.prototype,"append")
            expect(FormData.prototype.append).toHaveBeenCalledTimes(4);
            expect(fetch).toHaveBeenCalledWith(`https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,expect.any(Object))
            expect(ok).toEqual(true);
        })

        it('fails on error', async () => {
            jest.spyOn(global,'fetch').mockRejectedValue(new Error(''));
            const ok = await service.sendEmail('','',[]);
            expect(ok).toEqual(false);
        })

    })



})