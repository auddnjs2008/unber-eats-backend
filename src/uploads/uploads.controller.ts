import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import {  FileInterceptor } from '@nestjs/platform-express';
import * as AWS from "aws-sdk";


const BUCKET_NAME ="asdfnuberaie1235";

@Controller("uploads")
export class UploadsController {
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file) {
        AWS.config.update({
            region:'ap-northeast-2',
            credentials:{
                accessKeyId:process.env.AWS_ACCESS_KEY,
                secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
            }
        })
        try{
            // bucket 이름은 aws에서 특별해야 한다.
            const objectName = `${Date.now()+file.originalname}`;
            await new AWS.S3().putObject({Bucket:BUCKET_NAME,
                Body:file.buffer,
                Key: objectName,
                ACL:'public-read'

            }).promise();
            const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectName}`;
            return {url};
        }catch(e){
            console.log(e,'e');
            return null;
        }
      
    }
}