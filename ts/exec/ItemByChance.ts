import serverConfig from "../settings/serverconfig.json";
import { Player } from "../entity/Player";
import { ItemIds } from "../enums/ItemIds";

const Chances = {       
    DEFAULT: [40, 99],
    COMMON: [4, 40],
    RARE: [2, 3],
    SUPER_RARE: [1, 1]
}

function genRandomNumber(size: number): number {
    return (1 + Math.floor(Math.random() * size));
}

export function getItemByChance(player: Player) {
    let chanceProballity = genRandomNumber(98);

    if(player.hat == ItemIds.CROWN_ORANGE) {
        let toDecrease = genRandomNumber(10);
        chanceProballity = Math.max(1, (chanceProballity - toDecrease));
    }
    
    let itemsPriority = serverConfig.items_priority;
    for (const priority in itemsPriority) {
        let chanceByPriority = (Chances as any)[priority.toUpperCase()];
        
        if (chanceProballity >= chanceByPriority[0] && chanceProballity <= chanceByPriority[1]) { 
            let itemsByPriority = (itemsPriority as any)[priority];
            return itemsByPriority[Math.floor(Math.random() * itemsByPriority.length)];
        }
    }
}