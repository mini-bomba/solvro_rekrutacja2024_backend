import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class GetObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be retrieved',
  })
  @IsNumberString()
  id: number;
}

export class DeleteObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be deleted',
  })
  @IsNumberString()
  id: number;
}

export class UpdateObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be edited',
  })
  @IsNumberString()
  id: number;
}
