class Cron {
    deleteOldAudioFiles = {
    	schedule: '30 */1 * * *',
    	/**
		 * Add whatever activity needed here
         */
    	action: async () => {
        	console.log('DOING NOTHING...');
    	},
    };
}

export default Cron;
