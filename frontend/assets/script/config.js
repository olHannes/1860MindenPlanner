export let serverURL = "https://one860mindenplanner.onrender.com";
serverURL = "http://127.0.0.1:10000";


const devices = ["Boden", "Barren", "Sprung", "Reck", "Ringe", "Pauschenpferd"];

export const APPARATUS = [
    {
        id: "FL",
        nameDe: "Boden",
        nameEn: "Floor",
        icon: "./frontend/assets/images/equipment/Floor_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Maße der Bodenfläche: 12 x 12m",
            "Dauer der Übung: max. 75 sek."
        ],
        groups: [
            "Nicht-akrobatische Elemente",
            "Akrobatische Elemente vorwärts",
            "Akrobatische Elemente rückwärts"
        ]
    },
    {
        id: "PO",
        nameDe: "Pauschenpferd", 
        nameEn: "Pommel-Horse",
        icon: "./frontend/assets/images/equipment/Pommelhorse_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Übungsbeginn: mit geschlossenen Beinen aus dem Stand"
        ],
        groups: [
            "Einbeinschwünge und Scheren",
            "Kreis- und Thomasflanken, Kehrschwünge, Russenwendeschwünge",
            "Wanderelemente",
            "Abgänge"
        ]
    },
    {
        id: "RI",
        nameDe: "Rings", 
        nameEn: "Rings",
        icon: "./frontend/assets/images/equipment/Rings_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Übungsbeginn: im ruhigen Hang mit gestreckten Armen und Beinen"
        ],
        groups: [
            "Kippen und Schwungelemente, Schwünge durch den Handstand",
            "Kraft- und Halteelemente",
            "Schwung zu Kraftelementen",
            "Abgänge"
        ]
    },
    {
        id: "VA",
        nameDe: "Sprung", 
        nameEn: "Vault",
        icon: "./frontend/assets/images/equipment/Vault_icon.png",
        facts: [
            "Anzahl der Sprünge: 2 (unterschiedliche Gruppen möglich)"
        ],
        groups: [
            "Salti mit oder ohne Drehung",
            "Überschlagsprünge ohne oder mit Drehungen",
            "Überschlagsprünge seitwärts und Tsukahara-Sprünge",
            "Rondatsprünge"
        ]
    },
    {
        id: "PA",
        nameDe: "Barren", 
        nameEn: "Parralel-Bars",
        icon: "./frontend/assets/images/equipment/Parralelbars_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Höhe: 180cm (ab Mattenoberkante), 200cm (ab Boden)"
        ],
        groups: [
            "Elemente im Stütz oder durch den Stütz auf beiden Holmen",
            "Elemente, die im Oberarmstütz beginnen",
            "Schwungelemente durch den Hang an 1 oder 2 Holmen",
            "Abgänge"
        ]
    },
    {
        id: "HI",
        nameDe: "Reck", 
        nameEn: "Highbar",
        icon: "./frontend/assets/images/equipment/Highbar_icon.png",
        facts: [
            "Anzahl der Elemente: 6 + Abgang",
            "Höhe: 260cm (ab Mattenoberkante), 280cm (ab Boden)"
        ],
        groups: [
            "Langhangschwünge mit und ohne Drehungen",
            "Flugelemente",
            "Stangennahe und Adler-Elemente",
            "Abgänge"
        ]
    }
]