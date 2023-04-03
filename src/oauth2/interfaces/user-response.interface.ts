/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

 Copyright © 2023
 Afonso Barracha
*/

import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';

interface IUserReponse<P extends OAuthProvidersEnum, T> {
  readonly provider: P;
  readonly user: T;
}

interface IMicrosoftUser {
  readonly businessPhones: string[];
  readonly displayName: string;
  readonly givenName: string;
  readonly jobTitle: string;
  readonly mail: string;
  readonly mobilePhone: string;
  readonly officeLocation: string;
  readonly preferredLanguage: string;
  readonly surname: string;
  readonly userPrincipalName: string;
  readonly id: string;
}

interface IGoogleUser {
  readonly sub: string;
  readonly name: string;
  readonly given_name: string;
  readonly family_name: string;
  readonly picture: string;
  readonly email: string;
  readonly email_verified: boolean;
  readonly locale: string;
  readonly hd: string;
}

interface IFacebookPictureData {
  readonly height: number;
  readonly is_silhouette: boolean;
  readonly url: string;
  readonly width: number;
}

interface IFacebookPicture {
  readonly data: IFacebookPictureData;
}

interface IFacebookUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly picture: IFacebookPicture;
}

interface IGitHubPlan {
  readonly name: string;
  readonly space: number;
  readonly private_repos: number;
  readonly collaborators: number;
}

interface IGitHubUser {
  readonly login: string;
  readonly id: number;
  readonly node_id: string;
  readonly avatar_url: string;
  readonly gravatar_id: string;
  readonly url: string;
  readonly html_url: string;
  readonly followers_url: string;
  readonly following_url: string;
  readonly gists_url: string;
  readonly starred_url: string;
  readonly subscriptions_url: string;
  readonly organizations_url: string;
  readonly repos_url: string;
  readonly events_url: string;
  readonly received_events_url: string;
  readonly type: string;
  readonly site_admin: boolean;
  readonly name: string;
  readonly company: string;
  readonly blog: string;
  readonly location: string;
  readonly email: string;
  readonly hireable: boolean;
  readonly bio: string;
  readonly twitter_username: string;
  readonly public_repos: number;
  readonly public_gists: number;
  readonly followers: number;
  readonly following: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly private_gists: number;
  readonly total_private_repos: number;
  readonly owned_private_repos: number;
  readonly disk_usage: number;
  readonly collaborators: number;
  readonly two_factor_authentication: boolean;
  readonly plan: IGitHubPlan;
}

export type IOAuthUserResponse =
  | IUserReponse<OAuthProvidersEnum.MICROSOFT, IMicrosoftUser>
  | IUserReponse<OAuthProvidersEnum.GOOGLE, IGoogleUser>
  | IUserReponse<OAuthProvidersEnum.FACEBOOK, IFacebookUser>
  | IUserReponse<OAuthProvidersEnum.GITHUB, IGitHubUser>;
