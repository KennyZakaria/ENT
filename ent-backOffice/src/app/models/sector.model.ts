export interface Sector {
    id?: string;
    name: string;
    description?: string;
}

export interface UserSectorInfo {
    user_id: string;
    sectors: Sector[];
}
