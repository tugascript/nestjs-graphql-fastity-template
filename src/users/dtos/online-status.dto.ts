import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsIn } from 'class-validator';
import { OnlineStatusEnum } from '../enums/online-status.enum';

@ArgsType()
export abstract class OnlineStatusDto {
  @Field(() => OnlineStatusEnum)
  @IsEnum(OnlineStatusEnum)
  @IsIn(
    Object.values(OnlineStatusEnum).filter(
      (val) => val !== OnlineStatusEnum.OFFLINE,
    ),
  )
  public defaultStatus: OnlineStatusEnum;
}
