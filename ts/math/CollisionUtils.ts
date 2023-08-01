
import { Entity } from "../entity/Entity";
import { MapObject } from "../entity/MapObject";
import { EntityType } from "../enums/EntityType";
import { Utils } from "../utils/Utils";
import { MovementDirection } from "./MovementDirection";
import serverConfig from "../settings/serverconfig.json";

export class CollisionUtils {
    public static scheduleCollision (entity: Entity) {
        /**
         * Cancel collision resolver if our entity flying
         * or non-player.
         */
        if(entity.type != EntityType.PLAYERS
           || entity.ownerClass.isFly) return;
        
        /**
         * Init some vars
         */
        const queryEntities = entity.gameServer.queryManager.queryCircle(entity.x, entity.y , entity.radius),
              candidateEntities: any = [],
              overlappingEntities:any = [];

              
        /**
         * New position for entity
         */
        let resolvePosition: any;

        /**
         * Loop through all entities
         */
        for(let i = 0; i < queryEntities.length; i++) {
            const candidate = queryEntities[i];

            /**
             * Unpacking not elligble entities
             */
            if(candidate.id == entity.id || !candidate.isSolid) continue;

            /**
             * Entity Collide callback for building
             */
            if(Utils.isBuilding(candidate))
                //@ts-ignore
                candidate.ownerClass.onCollides(entity);

            /**
             * Resolved position from collidable entities
             */
            resolvePosition = CollisionUtils.resolveCollision(entity, candidate);
            /**
             * Candidate list
             */
            candidateEntities.push(candidate);
        }

        /**
         * If entity position contains in new list , we dont add it
         * It fixes too much entities in 1 block bug ( not stops player anymore )
         */

        for(let i = 0; i < candidateEntities.length; i++) {
            const elemtIn = overlappingEntities.find ((e:any) => e.x == candidateEntities[i].x && e.y == candidateEntities[i].y);

            if(elemtIn != null) continue;
            overlappingEntities.push(candidateEntities[i]);
        }
        /**
         * We resolve position
         */
        if(overlappingEntities.length == 1) {

            /**
             * If entities 1 just resolving it
             */
            entity.x = resolvePosition.x;
            entity.y = resolvePosition.y;
            
            //todo: updateBounds
        } else if(overlappingEntities.length >= 2) {
            
            /**
             * Divide speed to 18 for make movement inside useless
             */
            /**
             * Restore values to old one
             */
            entity.x = entity.oldX;
            entity.y = entity.oldY;
         
        }

        entity.collideCounter = overlappingEntities.length;

        if(overlappingEntities.length > 0)
           entity.old_speed = serverConfig.entities.player.speed_collides / entity.collideCounter;
           
    }
    public static getAngularVelocity(radius: number , velocity:number) {
        return (radius * velocity)/ (radius * radius);
    }

    public static resolveCollision(entity: Entity , candidate: Entity | MapObject) {

        const velocity = CollisionUtils.getAngularVelocity(candidate.radius + entity.radius , entity.speed)
        
        let oldAngle = Math.atan2(entity.oldY - candidate.y , entity.oldX - candidate.x);
        let angle = Math.atan2(entity.y - candidate.y, entity.x - candidate.x);
        let diff = oldAngle - angle;
    
        if(diff === 0) 
            return {x: entity.x , y: entity.y};
    
        if(diff > 5.8) 
            return Utils.getPointOnCircle(candidate.x , candidate.y, oldAngle + velocity, entity.radius + candidate.radius);
        else if(diff < -5.8) 
            return Utils.getPointOnCircle(candidate.x , candidate.y , oldAngle - velocity, entity.radius + candidate.radius);
        
        if(diff >= 0) 
            return Utils.getPointOnCircle(candidate.x , candidate.y , oldAngle - velocity, entity.radius + candidate.radius);

        return Utils.getPointOnCircle(candidate.x , candidate.y , oldAngle + velocity, entity.radius + candidate.radius);
    }
}