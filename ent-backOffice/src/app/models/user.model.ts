export interface KeycloakUser {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    roles?: string[];
}

export interface NewUserRequest {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    sector_ids: string[];
}
