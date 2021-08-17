import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

class Configuration {
    /**
     * Retrieve the private key
     */
    static privateKey = () => {
    	let privateKey = '';
    	try {
    		privateKey = fs.readFileSync(
    			path.join(__dirname, '../.private.pem'),
    			{ encoding: 'utf8' }
    		);
    	} catch {
    		privateKey = 'OMO x 1000000';
    	}

    	return privateKey;
    }

    /**
     * Retrieve the public key
     */
    static publicKey = () => {
    	let publicKey = '';
    	try {
    		publicKey = fs.readFileSync(
    			path.join(__dirname, '../.public.pem'),
    			{ encoding: 'utf8' }
    		);
    	} catch {
    		publicKey = 'OMO x 1000000';
    	}

    	return publicKey;
    }

    /**
     * Passes a data object to jwt.sign to sign and encode within a jwt
     *
     * @see {jwt.sign}
     */
    static sign = (data) => {
    	return jwt.sign(data, this.privateKey(), {
    		algorithm: 'RS256',
    		expiresIn: '100y',
    	});
    }
}

export default Configuration;
