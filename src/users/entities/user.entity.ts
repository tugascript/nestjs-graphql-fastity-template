/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  Embedded,
  Entity,
  Enum,
  OptionalProps,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import {
  BCRYPT_HASH,
  NAME_REGEX,
  SLUG_REGEX,
} from '../../common/constants/regex';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { CredentialsEmbeddable } from '../embeddables/credentials.embeddable';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { IUser } from '../interfaces/user.interface';

@ObjectType('User')
@Entity({ tableName: 'users' })
export class UserEntity extends LocalBaseEntity implements IUser {
  [OptionalProps]?:
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'picture'
    | 'onlineStatus'
    | 'defaultStatus'
    | 'confirmed'
    | 'suspended'
    | 'twoFactor'
    | 'credentials'
    | 'lastLogin'
    | 'lastOnline';

  @Field(() => String)
  @Property({ columnType: 'varchar(100)' })
  @IsString()
  @Length(3, 100)
  @Matches(NAME_REGEX)
  public name!: string;

  @Field(() => String)
  @Property({ columnType: 'varchar(110)', unique: true })
  @IsString()
  @Length(3, 110)
  @Matches(SLUG_REGEX)
  public username!: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar(255)', unique: true })
  @IsEmail()
  public email!: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar(255)', nullable: true })
  @IsOptional()
  @IsUrl()
  public picture?: string;

  @Property({ columnType: 'varchar(60)' })
  @IsString()
  @Length(59, 60)
  @Matches(BCRYPT_HASH)
  public password!: string;

  @Field(() => OnlineStatusEnum)
  @Enum({
    items: () => OnlineStatusEnum,
    default: OnlineStatusEnum.OFFLINE,
    columnType: 'varchar(14)',
  })
  @IsEnum(OnlineStatusEnum)
  public onlineStatus: OnlineStatusEnum = OnlineStatusEnum.OFFLINE;

  @Field(() => OnlineStatusEnum, { nullable: true })
  @Enum({
    items: () => OnlineStatusEnum,
    default: OnlineStatusEnum.ONLINE,
    columnType: 'varchar(14)',
  })
  @IsEnum(OnlineStatusEnum)
  public defaultStatus: OnlineStatusEnum = OnlineStatusEnum.ONLINE;

  @Property({ default: false })
  @IsBoolean()
  public confirmed: boolean = false;

  @Property({ default: false })
  @IsBoolean()
  public suspended: boolean = false;

  @Field(() => Boolean, { nullable: true })
  @Property({ default: false })
  @IsBoolean()
  public twoFactor: boolean = false;

  @Embedded(() => CredentialsEmbeddable)
  public credentials: CredentialsEmbeddable = new CredentialsEmbeddable();

  @Property()
  @IsDate()
  public lastLogin: Date = new Date();

  @Field(() => String)
  @Property()
  @IsDate()
  public lastOnline: Date = new Date();
}
