import { GameServer } from "../GameServer";

export interface TokenScore {

    score: number; // score used to buy kit
    id: string; // token identifier
    index: number; // index in array ( just for splice )
    session_id: string | number; // token_id of the current session
    session_info: number; // if current session bought kit cant buy again
    timestamp: number; // date of the last session LEAVED with this token
    join_timestamp: number; // date of the last PLAYER JOINED the game with this token

}

export class TokenManager {

    public tokens: TokenScore[];
    public gameServer: GameServer;

    constructor( gameServer: GameServer ) {

        this.tokens = [];
        this.gameServer = gameServer;

    }

    getToken( id: string ) {

        for ( let i = 0; i < this.tokens.length; i++ ) {

            let token = this.tokens[ i ];
            token.index = i;

            if ( ( token.id !== id ) && token.session_id !== id ) continue; // get token by id or session_id
            return token;

        }

        return false;
    }

    checkTokens() {

        for ( let i = 0; i < this.tokens.length; i++) {

            let token = this.tokens[i];
            if ( token.timestamp && +new Date() - token.timestamp > 1 * 60 * 60 * 1000 ) this.deleteToken( token.id );

        }

        return true;
    }

    createToken( id: string ) {

        let token: TokenScore | false  = this.getToken(id);
        if ( token ) return token;

        token = {
            score: 0,
            id: id,
            index: 0,
            session_id: 0,
            session_info: 0,
            timestamp: 0,
            join_timestamp: 0,
        }

        this.checkTokens(); // delete every tokens that lasted for +1 hours without activity
        this.tokens.push(token);
        return token;

    }
    deleteToken( id: string ) { 

        let token: TokenScore | false = this.getToken( id ); // update index
        if ( !token ) return false;

        this.tokens.splice(token.index, 1); 
        return false;
    }

    //dont reset for 1min i test sand shit
    joinToken( token: TokenScore, session_id: string ) { 

        let timeElapsed = +new Date() - token.timestamp;

        if( token.session_id !== session_id ) token.session_info = 0, token.join_timestamp = +new Date(); // no bought kit
        token.session_id = session_id;

        if ( token.timestamp && timeElapsed > 1 * 60 * 60 * 1000 ) {

            token.score = 0;
            token.timestamp = 0;
        }
        return token;
    }
    leaveToken( token: TokenScore ) { token.timestamp = +new Date(); };

}