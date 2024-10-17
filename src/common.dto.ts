import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be retrieved',
  })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class DeleteObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be deleted',
  })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class UpdateObjectParams {
  @ApiProperty({
    required: true,
    description: 'ID of the object to be edited',
  })
  @IsInt()
  @Type(() => Number)
  id: number;
}
