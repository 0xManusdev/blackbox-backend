export declare const Zone: {
    readonly TERMINAL_1: "TERMINAL_1";
    readonly TERMINAL_2: "TERMINAL_2";
    readonly PORTES_EMBARQUEMENT: "PORTES_EMBARQUEMENT";
    readonly ZONE_DOUANES: "ZONE_DOUANES";
    readonly PARKING: "PARKING";
    readonly HALL_ARRIVEE: "HALL_ARRIVEE";
    readonly HALL_DEPART: "HALL_DEPART";
    readonly ZONE_TRANSIT: "ZONE_TRANSIT";
    readonly AUTRE: "AUTRE";
};
export type Zone = (typeof Zone)[keyof typeof Zone];
