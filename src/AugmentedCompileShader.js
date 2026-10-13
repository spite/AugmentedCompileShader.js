const css = `#shaderReport{ box-sizing: border-box; position: fixed; left: 0; top: 0;
	right: 0; font-family: monaco, monospace; font-size: 12px; z-index: 1000;
	background-color: #b70000; color: #ffffff; white-space: normal;
	text-shadow: 0 -1px 0 rgba(0,0,0,.6); line-height: 1.2em; list-style-type: none;
	padding: 0; margin: 0; max-height: 300px; overflow: auto; }
	#shaderReport li{ padding: 10px; border-top: 1px solid rgba( 255, 255, 255, .2 );
	border-bottom: 1px solid rgba( 0, 0, 0, .2 ) }
	#shaderReport li p{ padding: 0; margin: 0 }
	#shaderReport li:nth-child(odd){ background-color: #c9542b }
	#shaderReport li p:first-child{ color: #eee }
	#shaderReport li p:last-child{ white-space: pre-wrap }`;

const hooks = [];

let style = null;
let report = null;

function hook( f, c ) {

	return function () {

		const res = f.apply( this, arguments );
		c.apply( this, arguments );
		return res;

	};

}

function getReport() {

	if ( style === null ) {

		style = document.createElement( 'style' );
		style.textContent = css;

	}

	if ( report === null ) {

		report = document.createElement( 'ul' );
		report.setAttribute( 'id', 'shaderReport' );

	}

	if ( ! style.isConnected ) document.head.appendChild( style );
	if ( ! report.isConnected ) ( document.body || document.documentElement ).appendChild( report );

	return report;

}

function addError( error, where, code ) {

	const list = getReport();

	const title = document.createElement( 'p' );
	const message = document.createElement( 'b' );
	message.textContent = error;
	title.append( 'ERROR "', message, '" ' + where );

	const line = document.createElement( 'p' );
	line.textContent = code;

	// the same error is listed once
	const key = title.textContent + '\n' + code;
	for ( const item of list.children ) if ( item.dataset.key === key ) return;

	const li = document.createElement( 'li' );
	li.dataset.key = key;
	li.append( title, line );
	list.appendChild( li );

}

function processErrors( errors, source, type ) {

	const re = /ERROR: \d+:(\d+): (.+)/gi;
	const lines = source.split( '\n' );

	let m;
	let found = false;

	while ( ( m = re.exec( errors ) ) !== null ) {

		const line = lines[ m[ 1 ] - 1 ];
		addError( m[ 2 ], 'in line ' + m[ 1 ] + ' of the ' + type + ' shader', line !== undefined ? line.trim() : '' );
		found = true;

	}

	// a log that has no line numbers is shown as it is
	if ( ! found && errors ) addError( errors.trim(), 'in the ' + type + ' shader', '' );

}

function compiled( shader ) {

	if ( this.isContextLost() || this.getShaderParameter( shader, this.COMPILE_STATUS ) ) return;

	const type = this.getShaderParameter( shader, this.SHADER_TYPE ) === this.VERTEX_SHADER ? 'vertex' : 'fragment';

	processErrors( this.getShaderInfoLog( shader ) || '', this.getShaderSource( shader ) || '', type );

}

function linked( program ) {

	if ( this.isContextLost() || this.getProgramParameter( program, this.LINK_STATUS ) ) return;

	// when a shader didn't compile, that is the error and it's already in the report
	const shaders = this.getAttachedShaders( program ) || [];
	if ( shaders.some( shader => ! this.getShaderParameter( shader, this.COMPILE_STATUS ) ) ) return;

	const log = ( this.getProgramInfoLog( program ) || '' ).trim();
	if ( log ) addError( log, 'linking the program', '' );

}

// the errors of compileShader and linkProgram are added to a report in the page, in every WebGL context
function install() {

	if ( hooks.length > 0 ) return;

	for ( const name of [ 'WebGLRenderingContext', 'WebGL2RenderingContext' ] ) {

		const context = globalThis[ name ];
		if ( context === undefined ) continue;

		const proto = context.prototype;
		hooks.push( { proto, compileShader: proto.compileShader, linkProgram: proto.linkProgram } );

		proto.compileShader = hook( proto.compileShader, compiled );
		proto.linkProgram = hook( proto.linkProgram, linked );

	}

}

function uninstall() {

	for ( const { proto, compileShader, linkProgram } of hooks ) {

		proto.compileShader = compileShader;
		proto.linkProgram = linkProgram;

	}

	hooks.length = 0;
	clear();

}

// removes the report from the page
function clear() {

	if ( report !== null ) {

		report.replaceChildren();
		report.remove();

	}

}

install();

export { install, uninstall, clear };
