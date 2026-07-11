class MaterialGrade {
    constructor(name, e, e90, g, g90) {
        this.name = name;
        this.e = e;
        this.e90 = e90;
        this.g = g;
        this.g90 = g90;
    }

    static getDefaults() {
        return [
            new MaterialGrade('MGP10', 1100, 110, 687.5, 62.5),
            new MaterialGrade('MGP12', 1100, 110, 687.5, 62.5),
        ];
    }
}
