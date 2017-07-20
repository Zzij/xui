'use strict';

import React from 'react'
import ReactDOM from 'react-dom';
import { xFetchJSON } from '../jsx/libs/xtools';
import { FormControl } from 'react-bootstrap';

var is_wx_ready = false;
var loc = {};
window.start = '市政';
window.end = '公安局';

function pushHistory(title, url) {
	var state = {
		title: title,
		url: url
	};
	window.history.pushState(state, title, url);
}

function addMarker(point, data, func) {
	var myIcon = new BMap.Icon("/assets/img/maps/point.png", new BMap.Size(16, 16), {
		offset: new BMap.Size(0, 0)
	});

	var marker = new BMap.Marker(point, {icon: myIcon});

	if (func) {
		marker.addEventListener("click", () => {
			func(data);
		});
	}

	window.map.addOverlay(marker);
}

function addBusMarker(point, png) {
	var myIcon = new BMap.Icon("/assets/img/maps/" + png, new BMap.Size(46, 44), {
		offset: new BMap.Size(0, 0)
	});

	var marker = new BMap.Marker(point, {icon: myIcon});

	window.map.addOverlay(marker);
}

function addLabel(point, label, data, func) {
	var myLabel = new BMap.Label(label, {
		offset: new BMap.Size(0, 0),
		position:point
	});

	if (func) {
		myLabel.addEventListener("click", () => {
			func(data);
		});
	}

	window.map.addOverlay(myLabel);
}

function addArrowLine(map, from_x, from_y, to_x, to_y, color, weight, opacity, isdashed, onclick_function)
{
	var line_style = {strokeColor:color, strokeWeight:weight, strokeOpacity:opacity};
	var polyline = new BMap.Polyline([new BMap.Point(from_x, from_y), new BMap.Point(to_x, to_y)], line_style);

	if (onclick_function != null) {
		polyline.addEventListener("click", onclick_function);
	}

	if (isdashed) polyline.setStrokeStyle("dashed");

	map.addOverlay(polyline);

	//arrow
	var length = 2;
	var angleValue = Math.PI/6;
	var linePoint = polyline.getPath();
	var arrowCount = linePoint.length;
	for (var i = 1; i < arrowCount; i++) {
		var x = (parseFloat(linePoint[i - 1].lng) + parseFloat(linePoint[i].lng)) / 2;
		var y = (parseFloat(linePoint[i - 1].lat) + parseFloat(linePoint[i].lat)) / 2;
		var mid = new BMap.Point(x, y);
		var pixelStart = map.pointToPixel(linePoint[i - 1]);
		var pixelEnd = map.pointToPixel(mid);
		var angle = angleValue;
		var r = length;
		var delta = 0;
		var param = 0;
		var pixelTemX, pixelTemY;
		var pixelX, pixelY, pixelX1, pixelY1;

		if (pixelEnd.x - pixelStart.x == 0) {
			pixelTemX = pixelEnd.x;

			if(pixelEnd.y > pixelStart.y) {
				pixelTemY = pixelEnd.y - r;
			} else {
				pixelTemY = pixelEnd.y + r;
			}

			pixelX = pixelTemX - r * Math.tan(angle);
			pixelX1 = pixelTemX + r * Math.tan(angle);
			pixelY = pixelY1 = pixelTemY;
		} else {
			delta = (pixelEnd.y - pixelStart.y) / (pixelEnd.x - pixelStart.x);
			param = Math.sqrt(delta * delta + 1);

			if ((pixelEnd.x - pixelStart.x) < 0) {
				pixelTemX = pixelEnd.x + r / param;
				pixelTemY = pixelEnd.y + delta * r / param;
			} else {
				pixelTemX = pixelEnd.x - r / param;
				pixelTemY = pixelEnd.y - delta * r / param;
			}

			pixelX = pixelTemX + Math.tan(angle) * r * delta / param;
			pixelY = pixelTemY - Math.tan(angle) * r / param;
			pixelX1 = pixelTemX - Math.tan(angle) * r * delta / param;
			pixelY1 = pixelTemY + Math.tan(angle) * r / param;
		}

		var pointArrow = map.pixelToPoint(new BMap.Pixel(pixelX, pixelY));
		var pointArrow1 = map.pixelToPoint(new BMap.Pixel(pixelX1, pixelY1));
		var Arrow = new BMap.Polyline([pointArrow, mid, pointArrow1], line_style);

		map.addOverlay(Arrow);
	}
}

function addArrowLineWithoutArrow(map, from_x, from_y, to_x, to_y, color, weight, opacity, isdashed, onclick_function)
{
	var line_style = {strokeColor:color, strokeWeight:weight, strokeOpacity:opacity};
	var polyline = new BMap.Polyline([new BMap.Point(from_x, from_y), new BMap.Point(to_x, to_y)], line_style);

	if (onclick_function != null) {
		polyline.addEventListener("click", onclick_function);
	}

	if (isdashed) polyline.setStrokeStyle("dashed");

	map.addOverlay(polyline);
}


class SelectSearch extends React.Component {
	constructor(props) {
		super(props);
		this.state = {options: [], name: props.station};
	}

	componentDidMount() {
	}

	autoComplete(e) {
		console.log('autoComplete', e.target.value);

		if (e.target.value == "所有站点" && this.props.onChange) {
			this.props.onChange('所有站点');
			return;
		}

		const options = this.props.options.filter((o) => {
			return o.stat_name.indexOf(e.target.value) >= 0;
		});

		console.log('options', options, options.length);

		this.setState({name: e.target.value, options : options});

		if (this.props.onChange) {
			const is_equal = options.filter((o) => {
				return (e.target.value == o.stat_name);
			});

			if (is_equal.length > 0) {
				this.props.onChange({value: e.target.value});
			}
		}
	}

	handleClick(name) {
		console.log('clicked name', name);

		this.setState({name: name, options: []});

		if (this.props.onChange) {
			this.props.onChange({value: name});
		}
	}

	hideComplete() {
		// this.setState({options: []});
	}

	render () {
		const _this = this;

		return <div>
			<input className = "weui-input" value={this.state.name} placeholder={this.props.placeholder}
				onChange={this.autoComplete.bind(this)}
				onBlur={this.hideComplete.bind(this)} />

			{
				this.state.options.length == 0 ? null :
				<div style={{position: "absolute", zIndex: 1000, backgroundColor: "#FFF", border: "1px solid #DDD"}}>	
				{	_this.props.selectType == '1' ? <li style={{listStyle: "none", padding: "5px"}} onClick={() => _this.handleClick("所有站点")}>所有站点</li>
						: ''
				}
				{
					this.state.options.map((o) => {
						return <li style={{listStyle: 'none', padding: "5px"}}
							onClick={() => _this.handleClick(o.stat_name)}>
							{o.stat_name}
						</li>
					})
				}
				</div>
			}
		</div>
	}

}

class LinePage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {stations: [], traffics: [], self_order: null, self_xpoint: 120.404126, self_ypoint: 37.369088};
	}

	loadScript() {
		var script = document.createElement("script");
		script.src = "http://api.map.baidu.com/api?v=2.0&ak=OGvbL6kRPgyBoV8q3bCgxeHfN6DKdOrx&callback=initializeBaiduMap";
		document.body.appendChild(script);
	}
	
	initializeBaiduMap() {
		var _this = this;
		console.log("initializeBaiduMap", _this);

		window.map = new BMap.Map("allmap");
		window.map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT}));   //add map navigation tools
		window.map.centerAndZoom(new BMap.Point(120.40086416919, 37.37223326585), 14);

		var geolocation = new BMap.Geolocation();
			geolocation.getCurrentPosition(function(r){
				if(this.getStatus() == BMAP_STATUS_SUCCESS){
					_this.setState({self_xpoint: r.point.lng, self_ypoint: r.point.lat});
					// _this.setState({self_xpoint: 120.404126, self_ypoint: 37.369088});
					setInterval(function(){
						xFetchJSON('/api/bus/traffic', {
							method: "POST",
							body: '{"line":'+_this.props.line.line_code+'}'
						}).then((obj) => {
							_this.setState({traffics: obj});
							xFetchJSON('/api/bus/traffic/self', {
								method: "POST",
								body: '{"line":'+_this.props.line.line_code+', "xpoint":'+_this.state.self_xpoint+', "ypoint":'+_this.state.self_ypoint+'}'
							}).then((obj) => {
								_this.setState({self_order: obj[0].station_order});
							}).catch((msg) => {
								console.error("new FIFO Err", msg);
							});
						}).catch((msg) => {
							console.error("new FIFO Err", msg);
						});
					},1000);
				}
				else {
				}
			},{enableHighAccuracy: true})
		}
	
	componentDidMount() {
		const _this = this;

		window.initializeBaiduMap = this.initializeBaiduMap.bind(this);
		this.loadScript();

		xFetchJSON('/api/bus/lines/' + this.props.line.line_code + '/stations').then((data) => {
			_this.setState({stations: data});
		});
	}

	handleRefresh() {
		// todo
	}

	handleToggleDirection() {
		const _this = this;
		let direction = this.state.stations.length > 0 ? this.state.stations[0].up_down_name : '下行';

		direction = direction == '上行' ? '下行' : '上行';

		xFetchJSON('/api/bus/lines/' + this.props.line.line_code + '/stations?direction=' + direction).then((data) => {
			console.log(data);
			_this.setState({stations: data});
		});
	}

	render() {
		const _this = this;
		const direction = this.state.stations.length > 0 ? this.state.stations[0].up_down_name : '下行';

		return <div>
			<div id = "allmap" style={{width: "0px", height: "0px"}} />
			<div className="weui-cell weui-cell_form">
				<div className="weui-cell__hd" style={{width: "40px"}}>
					<label className="weui-label">
						{this.props.line.line_code}路
					</label>
				</div>
				<div className="weui-cell__bd">
					{this.props.line.start_station}
					&nbsp;
					{
						direction == '上行' ? <span style={{color: 'red'}}>←</span> :
							<span style={{color: 'blue'}}>→</span>
					}

					&nbsp;
					{this.props.line.stop_station}
				</div>
				<div className="weui-cell__ft">
					<div style={{float: "right"}}>
						<button className="weui-btn weui-btn_mini weui-btn_default" onClick={this.handleRefresh.bind(this)}>刷新</button>&nbsp;
						<button className="weui-btn weui-btn_mini weui-btn_default" onClick={this.handleToggleDirection.bind(this)}>换向</button>
					</div>
				</div>
			</div>

		{
			this.state.stations.map((station) => {
				return <div className="weui-cell weui-cell_form">
					<div className="weui-cell__hd" style={{width: "40px"}}>
						<label className="weui-label">
							{
								direction == '上行' ? <span style={{color: 'red'}}>↑</span> :
									<span style={{color: 'blue'}}>↓</span>
							}

							&nbsp;

							{ station.station_order }
						</label>
					</div>
					<div className="weui-cell__bd">
							{station.stat_name}
					</div>
					{
						station.station_order == _this.state.self_order ? <div className="weui-cell__ft"><img src="/assets/img/maps/people.png" alt=""/>您的位置</div>:""
					}
					{
						_this.state.traffics.map((traffic) => {
							if (direction == "下行") {
								if (traffic.bus_status == "0" && traffic.prev_station_id == station.station_order) {
									if (station.station_order - _this.state.self_order > 0) {
										return <div className="weui-cell__ft">
											<img src="/assets/img/maps/bus-blue-small.png" alt=""/>距您还有{station.station_order - _this.state.self_order}站，预计约{(station.station_order - _this.state.self_order)*2}分钟
										</div>
									}
								}
							}
							if (direction == "上行") {
								if (traffic.bus_status == "2" && traffic.prev_station_id == station.station_order) {
									if (station.station_order - _this.state.self_order < 0) {
										return <div className="weui-cell__ft">
											<img src="/assets/img/maps/bus-blue-small.png" alt=""/>距您还有{_this.state.self_order - station.station_order}站，预计约，预计约{(_this.state.self_order - station.station_order)*2}分钟
										</div>
									}
								}
							}
						})
					}
					
				</div>
			})
		}

		</div>
	}
}

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {lines: [], line: null};
	}

	componentDidMount() {
		var _this = this;

		xFetchJSON('/api/bus/lines').then((data) => {
			console.log(data);
			this.setState({lines: data});
		});
	}

	handleClick(line) {
		const _this = this;

		this.setState({linePageShow: true, line: line});
		pushHistory(line.line_code, '#line_code_' + line.line_code);

		const fun = function(e) {
			console.log(e);
			_this.setState({linePageShow: false, line: null});

			window.removeEventListener("popstate", fun);
		};

		window.addEventListener("popstate", fun);
	}

	render() {
		const _this = this;

		if (this.state.linePageShow) {
			return <LinePage line={this.state.line} />
		}

		return <div>
		<ul>
			{
				this.state.lines.map((line) => {
					if (line.line_code > 100) return null;

					return <div className="weui-cell weui-cell_access"
						onClick={() => _this.handleClick(line)}>
						<div className="weui-cell__hd" style={{width: "40px"}}>
							<label className="weui-label">{line.line_code}路</label>
						</div>
						<div className="weui-cell__bd">
								{line.start_station}&nbsp;→&nbsp;
								{line.stop_station}
						</div>
						<div className="weui-cell__ft">6:20<br/>18:30</div>
					</div>
				})
			}

		</ul>
		</div>
	}
}

function freshStations(station, _this) {
	xFetchJSON('/api/bus/station?station=' + station).then((data) => {
		_this.setState({stations: data});
		if (window.map) {
			setupStations();
		} else {
			this.state.pendingSetupStations = true;
		}
	});
}

class StationSearch extends React.Component {
	constructor(props) {
		super(props);
		this.state={ 
			station: props.station, 
			stations: [],
			pendingSetupStations: false
		};
	}

	loadScript() {
		var script = document.createElement("script");
		script.src = "http://api.map.baidu.com/api?v=2.0&ak=OGvbL6kRPgyBoV8q3bCgxeHfN6DKdOrx&callback=initializeBaiduMap";
		document.body.appendChild(script);
	}

	componentWillUnmount() {
		window.map = null;
	}

	componentDidMount() {
		const _this = this;

		window.initializeBaiduMap = this.initializeBaiduMap.bind(this);
		this.loadScript();

		if (true || !loc.longitude) { // hardcoded for test
			loc = {longitude: 120.40086416919, latitude: 37.37223326585};
		}

		xFetchJSON('/api/bus/station?station=' + _this.state.station).then((data) => {
			_this.setState({stations: data});
			if (window.map) {
				_this.setupStations();
			} else {
				_this.state.pendingSetupStations = true;
			}
		});
	}

	render() {
		const _this = this;
		console.error('_this.props.station', _this.props.station);
		var url = '';
		if (_this.props.station == "所有站点") {
			url = '/api/bus/station';
		} else {
			url = '/api/bus/station?station=' + _this.props.station;
		}
		xFetchJSON(url).then((data) => {
			window.map.clearOverlays();
			data.forEach((station) => {
				const point = new BMap.Point(station.baidu_x, station.baidu_y);
				addMarker(point, station, _this.onMarkerClick.bind(_this));
				addLabel(point, station.stat_name, station, _this.onMarkerClick.bind(_this));
			});

			let max_x = data[0].baidu_x;
			let max_y = data[0].baidu_y;
			let min_x = data[0].baidu_x;
			let min_y = data[0].baidu_y;
			data.forEach((station) => {
				if (parseFloat(max_x) < parseFloat(station.baidu_x)) { max_x = station.baidu_x}
				if (parseFloat(max_y) < parseFloat(station.baidu_y)) { max_y = station.baidu_y}
				if (parseFloat(min_x) > parseFloat(station.baidu_x)) { min_x = station.baidu_x}
				if (parseFloat(min_y) > parseFloat(station.baidu_y)) { min_y = station.baidu_y}
			});

			let center_x = (parseFloat(max_x) + parseFloat(min_x))/2;
			let center_y = (parseFloat(max_y) + parseFloat(min_y))/2;
			let center_point = new BMap.Point(center_x, center_y);

			window.map.centerAndZoom(center_point, 14);
		});

		let height = window.innerHeight - 40;
		return <div>
			<div id = "allmap" style={{width: "100%", height: height}} />
		</div>
	}

	setupStations() {
		const _this = this;

		this.state.stations.forEach((station) => {
			const point = new BMap.Point(station.baidu_x, station.baidu_y);
			addMarker(point, station, _this.onMarkerClick.bind(_this));
			addLabel(point, station.stat_name, station, _this.onMarkerClick.bind(_this));
		});
	}

	initializeBaiduMap() {
		console.log("initializeBaiduMap", this);

		window.map = new BMap.Map("allmap");
		window.map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT}));   //add map navigation tools

		if (true || !loc.longitude) { // hardcoded for test
			loc = {longitude: 120.40086416919, latitude: 37.37223326585};
		}

		if (loc.longitude) {
			window.map.centerAndZoom(new BMap.Point(loc.longitude, loc.latitude), 14);
		}

		if (this.state.pendingSetupLineStations) {
			this.setupLineStations();
		} else if (this.state.pendingSetupStations) {
			this.setupStations();
		}
	}

	onMarkerClick(station) {
		console.log("clicked", station);

		xFetchJSON('/api/bus/station/lines?name=' + station.stat_name).then((data) => {
			console.log('lines for station', data);

			const opts = {
				width : '',
				height: '',
				title : station.stat_name
			}

			var text = '<a onclick="window.start=(\'' + station.stat_name + '\');">设为起点</a> '
				+ '<a onclick="window.end=(\'' + station.stat_name + '\');">设为终点</a><br><br>';
			var lines_showed = [];
			data.forEach((l) => {
				if (lines_showed.includes(l.line_code)) {
					return;
				}
				lines_showed.push(l.line_code);
				text += '<font>' + l.line_code + '路: ' + l.start_station + '-' + l.stop_station + '</font><br>';
			});

			const infoWindow = new BMap.InfoWindow(text, opts);
			window.map.openInfoWindow(infoWindow, new BMap.Point(station.baidu_x, station.baidu_y));
		});
	}
}

class TransferMap extends React.Component {
	constructor(props) {
		super(props);
		this.state={
			lines: {}, stations: [],
			candidate: props.candidate
		};
	}

	loadScript() {
		var script = document.createElement("script");
		script.src = "http://api.map.baidu.com/api?v=2.0&ak=OGvbL6kRPgyBoV8q3bCgxeHfN6DKdOrx&callback=initializeBaiduMap";
		document.body.appendChild(script);
	}

	onMarkerClick(station) {
		console.log("clicked", station);

		xFetchJSON('/api/bus/station/lines?name=' + station.stat_name).then((data) => {
			console.log('lines for station', data);

			const opts = {
				width : '',
				height: '',
				title : station.stat_name
			}

			var text = '<br>';
			var lines_showed = [];
			data.forEach((l) => {
				if (lines_showed.includes(l.line_code)) {
					return;
				}
				lines_showed.push(l.line_code);
				if (l.line_code == station.line_code) {
					text += '<font color="#FF0000">' + l.line_code + '路: ' + l.start_station + '-' + l.stop_station + '</font><br>';
				} else {
					text += '<font>' + l.line_code + '路: ' + l.start_station + '-' + l.stop_station + '</font><br>';
				}
			});

			const infoWindow = new BMap.InfoWindow(text, opts);
			window.map.openInfoWindow(infoWindow, new BMap.Point(station.baidu_x, station.baidu_y));
		});
	}

	is_show_arrow(lineStations, i) {
		var flag1, flag2;
		flag1 = lineStations[i].show;

		if (i+1<lineStations.length) {
			flag2 = lineStations[i+1].show;
		} else {
			flag2 = flag1;
		}

		//sqlite: the value is 1; pg: the value is t
		if ((flag1 == 1 && flag2 == 1) || (flag1 == 't' && flag2 == 't')) {
			return true;
		} else {
			return false;
		}
	}

	setupLineStations() {
		const _this = this;
		const lines = Object.keys(this.state.lines);

		let station_names = this.state.candidate.stat_names.split('-');
		let station_showed = [];
		const start_station = station_names.shift()
		const stop_station = station_names.pop()

		const is_x_station = function(station) {
			for(var i = 0; i < station_names.length; i++) {
				if (station_names[i] == station) return true;
			}

			return false;
		}

		const is_station_showed = function(station) {
			for(var i = 0; i < station_names.length; i++) {
				if (station_showed[i] == station) return true;
			}

			return false;
		}

		let max_x, max_y, min_x, min_y, flags=0;
		const colors = ['red', 'blue', 'green', '#FFFF00'];
		let colors_i = 0;
		lines.forEach((line) => {
			_this.state.lines[line].forEach((station) => {
				const point = new BMap.Point(station.baidu_x, station.baidu_y);
				addMarker(point, station, _this.onMarkerClick.bind(_this));

				if (flags == 0) {
					max_x = station.baidu_x;
					max_y = station.baidu_y;
					min_x = station.baidu_x;
					min_y = station.baidu_y;
					flags = 1;
				}
				if (parseFloat(max_x) < parseFloat(station.baidu_x)) { max_x = station.baidu_x}
				if (parseFloat(max_y) < parseFloat(station.baidu_y)) { max_y = station.baidu_y}
				if (parseFloat(min_x) > parseFloat(station.baidu_x)) { min_x = station.baidu_x}
				if (parseFloat(min_y) > parseFloat(station.baidu_y)) { min_y = station.baidu_y}

				if (station.stat_name == start_station) {
					const label = station.line_code + '路 ' + station.stat_name + ' 上车';
					addLabel(point, label, station, _this.onMarkerClick.bind(_this));
				} else if (station.stat_name == stop_station) {
					const label = station.line_code + '路 ' + station.stat_name + ' 下车';
					addLabel(point, label, station, _this.onMarkerClick.bind(_this));
				} else if (is_x_station(station.stat_name)) {
					if (!(is_station_showed(station.stat_name))) {
						const label = station.stat_name + ' 换乘';
						addLabel(point, label, station, _this.onMarkerClick.bind(_this));
						station_showed.push(station.stat_name);
					}
				}
			});

			const lineStations = this.state.lines[line];

			for(var i = 0; i < lineStations.length - 1; i++) {
				if (this.is_show_arrow(lineStations, i)) {
					addArrowLine(window.map, lineStations[i].baidu_x, lineStations[i].baidu_y, lineStations[i+1].baidu_x, lineStations[i+1].baidu_y, colors[colors_i], 4, 2, false);
				} else{
					addArrowLineWithoutArrow(window.map, lineStations[i].baidu_x, lineStations[i].baidu_y, lineStations[i+1].baidu_x, lineStations[i+1].baidu_y, colors[colors_i], 2, 0.5, false);
				}
			}

			console.log('color: ', colors_i, colors[colors_i]);

			colors_i = colors_i+1;
		});

		let center_x = (parseFloat(max_x) + parseFloat(min_x))/2;
		let center_y = (parseFloat(max_y) + parseFloat(min_y))/2;
		let center_point = new BMap.Point(center_x, center_y);

		if (window.map) {
			window.map.centerAndZoom(center_point, 14);
		}
	}

	initializeBaiduMap() {
		console.log("initializeBaiduMap", this);

		window.map = new BMap.Map("allmap");
		window.map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT}));   //add map navigation tools

		if (true || !loc.longitude) { // hardcoded for test
			loc = {longitude: 120.40086416919, latitude: 37.37223326585};
		}

		if (loc.longitude) {
			window.map.centerAndZoom(new BMap.Point(loc.longitude, loc.latitude), 14);
		}

		if (this.state.pendingSetupLineStations) {
			this.setupLineStations();
		}
	}

	componentWillUnmount() {
		window.map = null;
	}

	componentDidMount() {
		const _this = this;

		window.initializeBaiduMap = this.initializeBaiduMap.bind(this);
		this.loadScript();

		const station_names = this.props.candidate.stat_names.split('-');
		const lines = this.props.candidate.all_lines.split('-');
		let i = 0;
		let j = 0;

		lines.forEach((line) => {
			const start = station_names[i]
			const stop = station_names[i+1];
			const colors = ['red', 'blue', 'green', '#FFFF00'];

			xFetchJSON('/api/bus/lines/' + line + '/stations?start=' + start + '&stop=' + stop).then((data) => {
				const _this = this;
				console.log('stations', data);
				data.color = colors[j];
				_this.state.lines[line] = data;
				_this.setState({lines: _this.state.lines});

				j++;

				if (j == lines.length) {
					if (window.map) {
						this.setupLineStations();
					} else {
						this.state.pendingSetupLineStations = true;
					}
				}
			});

			i++;
		});
	}

	onSelectChange(e) {
		const _this=this;

		let params = e.target.value.split(' ');
		let options = [];
		options.lines=params[0];
		options.stat_names=params[1];
		options.offs=parseInt(params[2]);
		options.all_plans = this.props.candidate.all_plans;

		const station_names = params[1].split('-');
		const lines = params[0].split('-');
		let i = 0;
		let j = 0;

		_this.setState({candidate: options});

		//clear old map informations
		_this.setState({lines: []});
		window.map.clearOverlays();

		//show new map informations
		lines.forEach((line) => {
			const start = station_names[i]
			const stop = station_names[i+1];
			const colors = ['red', 'blue', 'green', '#FFFF00'];

			xFetchJSON('/api/bus/lines/' + line + '/stations?start=' + start + '&stop=' + stop).then((data) => {
				const _this = this;
				console.log('stations', data);
				data.color = colors[j];
				_this.state.lines[line] = data;
				_this.setState({lines: _this.state.lines});

				j++;

				if (j == lines.length) {
					this.setupLineStations();
				}
			});

			i++;
		});
	}

	render() {
		let height = 580;
		height = window.innerHeight - 40;
		const _this = this;
		console.log('render run:', _this.state);

		if (!_this.state.candidate) {
			return <div></div>
		}

		return <div>
			<center><select id='myselect' width="100%" onChange={_this.onSelectChange.bind(_this)}>
				{
						_this.state.candidate.all_plans.map(function(c) {
							if (c.id == _this.state.candidate.id) {
								return <option selected="selected">{c.all_lines} {c.stat_names} 共{c.offs}站</option>;
							} else {
								return <option>{c.all_lines} {c.stat_names} 共{c.offs}站</option>;
							}
						})
					}
				}
			</select></center>
			<div id = "allmap" style={{width: "100%", height: height}} />
		</div>
	}
}

class Stations extends React.Component {
	constructor(props) {
		super(props);
		this.state = {stations: [], inputStationName: '文化区'};
	}

	componentDidMount() {
		const _this = this;
		xFetchJSON('/api/bus/station').then((data) => {
			console.log(data);
			_this.setState({stations: data});
		});
	}

	onChange(e) {
		this.setState({inputStationName: e.value});
	}

	render() {
		return <div>站点查询
			<SelectSearch options={this.state.stations} selectType='1' station={this.state.inputStationName} placeholder="请输入站点名称" onChange={this.onChange.bind(this)}/>
			<StationSearch station={this.state.inputStationName}/>
		</div>
	}
}

class Change extends React.Component {
	constructor(props) {
		super(props);
		this.state = {candidates: [], stations: [], station1: null, station2: null, searched: null};

		this.onChange1 = this.onChange1.bind(this);
		this.onChange2 = this.onChange2.bind(this);
	}

	componentDidMount() {
		const _this = this;
		xFetchJSON('/api/bus/station').then((data) => {
			console.log(data);
			_this.setState({stations: data});
		});
	}

	onChange1(e) {
		this.setState({station1: e.value})
	}

	onChange2(e) {
		this.setState({station2: e.value})
	}

	handleSearchInterchange(e) {
		e.preventDefault();
		const _this = this;

		xFetchJSON('/api/bus/interchange?start=' + this.state.station1 + '&stop=' + this.state.station2).then((data) => {
			console.log(data);
			_this.setState({searched: 1});
			_this.setState({candidates: data});
		});
	}

	showOnMap(candidate) {
		const _this = this;
		let options = candidate;

		options.all_plans = _this.state.candidates;
		ReactDOM.render(<TransferMap candidate={options}/>, document.getElementById('main'));
	}

	render() {
		const _this = this;
		var content;

		if (this.state.candidates.length > 0) {
			content = <ul> {
				this.state.candidates.map((candidate) => {
					var line1_info = '', line2_info = '', line3_info = '';
					if (candidate.line1) line1_info = candidate.line1 + '路[' + candidate.off1 + '站] ';
					if (candidate.line2) line2_info = candidate.stat_name1+ ' ' + candidate.line2 + '路[' + candidate.off2 + '站] ';
					if (candidate.line3) line3_info = candidate.stat_name2+ ' ' + candidate.line3 + '路[' + candidate.off3 + '站] ';

					return <div className="weui-cell weui-cell_access">
							<div className="weui-cell__bd">
							<li style={{listStyle:"none",fontSize:"14px"}}
								onClick={() => _this.showOnMap(candidate)}>
								[共{candidate.offs}站]&nbsp;
								{line1_info}
								{line2_info}
								{line3_info}
							</li>
						</div>
						<div className="weui-cell__ft"></div>
				</div>
				})
			} </ul>
		} else {
			if (_this.state.searched) { content = '没有找到换乘方案';}
		}

		return <div className="page" style={{padding:"0 15px"}}>
			<h1 className="page__title" style={{textAlign:"center",margin:"10px 0"}}>换乘查询</h1>

			<div className="weui-cell">
				<div className="weui-cell__hd"><label className="weui-label">起点：</label></div>
				<div className="weui-cell__bd">
					<SelectSearch options={this.state.stations} selectType='0' placeholder="请输入出发站" station={window.start} onChange={this.onChange1}/>
				</div>
			</div>

			<div className="weui-cell">
				<div className="weui-cell__hd"><label className="weui-label">终点：</label></div>
				<div className="weui-cell__bd">
					<SelectSearch options={this.state.stations} selectType='0' placeholder="请输入目的站" station={window.end} onChange={this.onChange2}/>
				</div>
			</div>

			<hr/>

			<a href="#" className="weui-btn weui-btn_primary" style={{marginTop:"10px"}} onClick={this.handleSearchInterchange.bind(this)}>查询</a>
			<br/>

			<div class="page__bd">
			{content}
			</div>

		</div>
	}
}

class App extends React.Component{
	handleClick(menu) {
		switch(menu) {
			case "lines": ReactDOM.render(<Home/>, document.getElementById('main')); break;
			case "stations": ReactDOM.render(<Stations/>, document.getElementById('main')); break;
			case "change": ReactDOM.render(<Change/>, document.getElementById('main')); break;
			default: ReactDOM.render(<Home/>, document.getElementById('main'));
		}
	}

	componentDidMount() {
		const _this = this;

		wx.openLocation({
			latitude: 0, // 纬度，浮点数，范围为90 ~ -90
			longitude: 0, // 经度，浮点数，范围为180 ~ -180。
			name: '', // 位置名
			address: '', // 地址详情说明
			scale: 1, // 地图缩放级别,整形值,范围从1~28。默认为最大
			infoUrl: '' // 在查看位置界面底部显示的超链接,可点击跳转
		});
	}

	render() {
		const _this = this;
		return <div>
			<div style={{width:"100%",height:"50px"}}></div>
				<div className="weui-tabbar" style={{position: "fixed"}}>
					<a className="weui-tabbar__item" onClick={() => _this.handleClick("lines")}>
						<div className="weui-tabbar__icon">
							<img src="/assets/wechat_img/icon_nav_article.png" alt=""/>
						</div>
						<p className="weui-tabbar__label">线路查询</p>
					</a>
					<a className="weui-tabbar__item" onClick={() => _this.handleClick("stations")}>
						<div className="weui-tabbar__icon">
							<img src="/assets/wechat_img/icon_nav_button.png" alt=""/>
						</div>
						<p className="weui-tabbar__label">站点查询</p>
					</a>
					<a className="weui-tabbar__item">
						<div className="weui-tabbar__icon" onClick={() => _this.handleClick("change")}>
							<img src="/assets/wechat_img/icon_nav_cell.png" alt=""/>
						</div>
						<p className="weui-tabbar__label">换乘查询</p>
					</a>
				</div>
			</div>
	}
}

wx.ready(function () {
	is_wx_ready = true;

	const shareData = {
		title: document.title,
		desc: document.title,
		link: location.href.split('#')[0] + 1,
		imgUrl: 'http://xswitch.cn/assets/img/ticket.png'
	};

	wx.onMenuShareAppMessage(shareData);

	wx.getLocation({
		type:'wgs84',//默认为wgs84的gps坐标，
		//如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
		success:function(res){
			var latitude=res.latitude;
			var longitude=res.longitude;
			var speed=res.speed;
			var accuracy=res.accuracy;
			console.log('经度：'+latitude+'，纬度：'+longitude);

			loc = res;

			if (window.map) {
				window.map.centerAndZoom(new BMap.Point(loc.longitude, loc.latitude), 14);
			}
		}
	});
});

xFetchJSON('/api/wechat/xyt/jsapi_ticket?url=' + escape(location.href.split('#')[0])).then((data) => {
	wx.config({
		// debug: true,
		appId: data.appId,
		timestamp: data.timestamp,
		nonceStr: data.nonceStr,
		signature: data.signature,
		jsApiList: [
			'checkJsApi',
			'openLocation',
			'getLocation',
			'onMenuShareTimeline',
			'onMenuShareAppMessage'
		]
	});
});

ReactDOM.render(<Home/>, document.getElementById('main'));
ReactDOM.render(<App/>, document.getElementById('body'));