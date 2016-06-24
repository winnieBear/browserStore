import SwfStore from './flash_store/swfstore';
import LocalStore  from './local_store/localStorage';
import CookieStore  from './cookie_store/cookieStorage';
import Log from './utils/log';
import {baseConfig,flashStoreConfig,localStoreConfig,cookieStoreConfig} from './conf/conf';
import getStore from './getStore';

var log = Log(baseConfig.debug,baseConfig.namespace);
log('info','store Initializing ---');
var arrEng = [
{
	name:'flashStore',
	engin:SwfStore,
	config:flashStoreConfig
},{
	name:'localStore',
	engin:LocalStore,
	config:localStoreConfig
},{
	name:'cookieStore',
	engin:CookieStore,
	config:cookieStoreConfig
}];

var store = getStore(arrEng,log);

log('info','store Initializing end.')

export default store ;
