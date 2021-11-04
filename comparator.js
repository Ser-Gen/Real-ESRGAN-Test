// протез для нестандартных событий
(function () {
	if ( typeof window.CustomEvent === "function" ) return false;

	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	};

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();

function Comparator (cfg) {
	if (typeof cfg === 'undefined') {
		cfg = {};
	};

	this.width = cfg.width || 300;
	this.height = cfg.height || 300;
	this.bg = cfg.bg || '#555';

	this.canvas = document.createElement('canvas');
	this.cx = this.canvas.getContext('2d');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.canvas.className = 'Comparator';

	this.A = null;
	this.B = null;
	this.Map = null;

	this.reset();

	var self = this;

	this.canvas.addEventListener('wheel', function (e) {
		self.mousewheel.call(self, e);
	});
	this.canvas.addEventListener('mousedown', function (e) {
		self.mousedown.call(self, e);
	});
	document.addEventListener('mousemove', function (e) {
		self.mousemove.call(self, e);
	});
	document.addEventListener('mouseup', function (e) {
		self.mouseup.call(self, e);
	});
};

// генерация событий
Comparator.prototype.trigger = function (elem, name, data) {
	var event;
	var HTMLEvents = ['change'];
	
	if (HTMLEvents.indexOf[name] > -1) {
		event = document.createEvent('HTMLEvents');
		event.initEvent(name, true, false);
	}
	else {
		if (window.CustomEvent) {
			event = new CustomEvent(name, { detail: data });
		}
		else {
			event = document.createEvent('CustomEvent');
			event.initCustomEvent(name, true, true, data);
		};
	};

	elem.dispatchEvent(event);
};

Comparator.prototype.mousewheel = function (e) {
	var isZoomIn = e.deltaY < 0;
	var offset = this.canvas.getBoundingClientRect();
	var smooth = true;
	var newZoom = isZoomIn ? 1.33 : .75;

	if (
		this.zoom <= 1
		&& this.isFits()
		&& !isZoomIn
	) {
		return;
	}

	// СДЕЛАТЬ
	// ограничить максимальный масштаб
	this.zoom *= newZoom;

	if (Math.abs(1 - this.zoom) < .15) {
		this.zoom = 1;
	}

	smooth = this.zoom < 2;

	this.cx.msImageSmoothingEnabled = smooth;
	this.cx.mozImageSmoothingEnabled = smooth;
	this.cx.webkitImageSmoothingEnabled = smooth;
	this.cx.imageSmoothingEnabled = smooth;

	this.setZoom(e.clientX - offset.left, e.clientY - offset.top, newZoom);
	
	if (this.isFits()) {
		this.center();
	}

	this.trigger(this.canvas, 'zoom', this.zoom * 100);
};

Comparator.prototype.isFits = function () {
	return (
		this.width > this.A.width * this.zoom
		&& this.height > this.A.height * this.zoom
	)
}

Comparator.prototype.setA = function (data) {
	var self = this;

	return self.prepareData(data).then(function (data) {
		if (
			!self.A
			
			// центрируется и при переключении на другой формат
			// того же файла
			|| self.zoom === 1
		) {
			self.center(data);
		};

		self.A = data;
		self.draw();

		return self;
	});
};

Comparator.prototype.setB = function (data) {
	var self = this;

	return self.prepareData(data).then(function (data) {
		self.B = data;
		self.draw();

		return self;
	});
};

Comparator.prototype.computeMap = function (type) {
	var self = this;
	var image1 = self.A.getContext('2d').getImageData(0, 0, self.A.width, self.A.height);
	var image2 = self.B.getContext('2d').getImageData(0, 0, self.B.width, self.B.height);

	if (
		type === 'butteraugli'
		&& butteraugli
	) {
		return butteraugli({
			image1: image1,
			image2: image2
		}).then(function (data) {
			self.setMap(data.heatmap);
			
			return {
				map: data.heatmap,
				distance: data.distance,
				duration: data.duration
			};
		});
	}
	else if (
		type === 'psnrhvsm'
		&& psnrhvsm
	) {
		return psnrhvsm({
			image1: image1,
			image2: image2
		}).then(function (data) {
			self.setMap(data.heatmap);

			return {
				map: data.heatmap,
				distance: data.distance,
				duration: data.duration
			}
		})
	}
	else if (
		type === 'color_psnrhma'
		&& color_psnrhma
	) {
		return color_psnrhma({
			image1: image1,
			image2: image2
		}).then(function (data) {
			self.setMap(data.heatmap);

			return {
				map: data.heatmap,
				distance: data.distance,
				duration: data.duration
			}
		})
	}

	return new Promise(function (resolve) { resolve(null); });
};

Comparator.prototype.setMap = function (data) {
	var self = this;

	if (!data) {
		self.Map = null;
		self.draw();

		return self;
	};

	return self.prepareData(data).then(function (data) {
		self.Map = data;
		self.draw();

		return self;
	});
};

Comparator.prototype.prepareData = function (data) {
	var self = this;

	return new Promise(function (resolve, reject) {
		if (data instanceof ImageData) {
			resolve(self.canvasFromImageData(data));
		}
		else if (typeof data === 'string') {
			resolve(self.canvasFromImageSrc(data));
		}
		// else if (data instanceof Promise) {
		// 	console.trace();
		// 	console.log(data);
		// 	data.then(function (data) {
		// 		if (data.nodeName === 'CANVAS') {
		// 			resolve(data);
		// 		};
		// 	});
		// }
		else {
			resolve(data);
		};
	// }).then(self.resizeImage);
	});
};

Comparator.prototype.canvasFromImageData = function (data) {
	var c = document.createElement('canvas');
	var cx = c.getContext('2d');

	c.width = data.width;
	c.height = data.height;

	cx.putImageData(data, 0, 0);

	return c;
};

Comparator.prototype.canvasFromImageSrc = function (src) {
	return new Promise(function (resolve, reject) {
		var i = new Image();

		i.onload = function () {
			var c = document.createElement('canvas');
			var cx = c.getContext('2d');
		
			c.width = i.width;
			c.height = i.height;
		
			cx.drawImage(i, 0, 0, c.width, c.height);
		
			resolve(c);
		};

		i.src = src;
	});
};

Comparator.prototype.resizeImage = function (data) {
	var c = document.createElement('canvas');
	var cx = c.getContext('2d');

	var w = data.width;
	var h = data.height;
	var newW;
	var newH;
	var ratio;

	if (
		w > 1000
		|| h > 1000
	) {
		if (w > h) {
			ratio = 1000 / w;
			newW = 1000;
			newH = ratio * h;
		}
		else {
			ratio = 1000 / h;
			newW = ratio * w;
			newH = 1000;
		}
	}
	else {
		newW = w;
		newH = h;
	}

	c.width = newW;
	c.height = newH;

	cx.drawImage(data, 0, 0, c.width, c.height);

	return c;
}

Comparator.prototype.resize = function (node) {
	if (!node) {
		node = this.canvas.parentNode;
	};

	this.width = node.offsetWidth;
	this.height = node.offsetHeight;

	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.reset();
	this.draw();
};

Comparator.prototype.reset = function () {
	this.pos = {
		x: 0,
		y: 0
	};
	this.cur = {
		x: 0,
		y: 0
	};

	this.zoom = 1;
	
	this.isMoving = null;
	this.tmpPos = null;
	
	this.cx.fillStyle = this.bg;
	this.cx.fillRect(0, 0, this.width, this.height);

	this.center();

	this.trigger(this.canvas, 'zoom', this.zoom * 100);
};

Comparator.prototype.center = function (data) {
	if (data) {
		this.A = data;
	};

	if (this.A) {
		this.pos.x = this.width / 2 - this.A.width * this.zoom / 2;
		this.pos.y = this.height / 2 - this.A.height * this.zoom / 2;
		this.draw();
	};
}

Comparator.prototype.draw = function (tmpPos) {
	if (!this.A && !this.B) {
		return;
	};

	var self = this;
	var curPos = self.pos;

	if (tmpPos) {
		curPos = tmpPos;
	};

	requestAnimationFrame(function () {
		var part = .5;
		var mouseInside = false;

		self.cur.x = Math.round(self.cur.x);
		self.cur.y = Math.round(self.cur.y);
		curPos.x = Math.round(curPos.x);
		curPos.y = Math.round(curPos.y);

		part = (self.cur.x - curPos.x) / (self.A.width * self.zoom);

		if (
			self.cur.x >= (curPos.x < 0 ? 0 : curPos.x)
			&& self.cur.x <= Math.min(curPos.x + self.A.width * self.zoom, self.width)
			&& self.cur.y >= (curPos.y < 0 ? 0 : curPos.y)
			&& self.cur.y <= Math.min(curPos.y + self.A.height * self.zoom, self.height)
		) {
			mouseInside = true;
		};

		self.cx.fillStyle = self.bg;
		self.cx.fillRect(0, 0, self.width, self.height);

		self.cx.clearRect(
			curPos.x, curPos.y,
			Math.round(self.A.width * self.zoom), Math.round(self.A.height * self.zoom)
		);

		if (self.A) {
			try {
				self.cx.drawImage(
					self.A,
					0, 0,
					self.A.width * part, self.A.height,
					curPos.x, curPos.y,
					self.A.width * self.zoom * part, self.A.height * self.zoom
				);
			} catch (e) {
				console.log(e);
				console.log(
					self.A,
					0, 0,
					self.A.width * part, self.A.height,
					curPos.x, curPos.y,
					self.A.width * self.zoom * part, self.A.height * self.zoom
				);
			}
		}

		if (self.B) {
			try {
				self.cx.drawImage(
					self.B,
					self.B.width * part, 0,
					self.B.width * (1 - part), self.B.height,
					Math.round(curPos.x + self.B.width * self.zoom * part), curPos.y,
					self.B.width * self.zoom * (1 - part), self.B.height * self.zoom
				);
			} catch (e) {
				console.log(e);
				console.log(
					self.B,
					self.B.width * part, 0,
					self.B.width * (1 - part), self.B.height,
					Math.round(curPos.x + self.B.width * self.zoom * part), curPos.y,
					self.B.width * self.zoom * (1 - part), self.B.height * self.zoom
				);
			}
		}

		if (self.Map && !mouseInside) {
			self.cx.drawImage(
				self.Map,
				0, 0,
				self.Map.width, self.Map.height,
				curPos.x, curPos.y,
				self.Map.width * self.zoom, self.Map.height * self.zoom
			);
		};
	});
};

// получать смещение относительно картинки
// x, y — точка, которую увеличивают
// ratio — степень увеличения относительно текущего значения
Comparator.prototype.setZoom = function (x, y, ratio) {
	this.pos.x = - ((- this.pos.x + x) * ratio - x);
	this.pos.y = - ((- this.pos.y + y) * ratio - y);

	this.draw(this.pos);
};

Comparator.prototype.mousedown = function (e) {
	this.isMoving = {
		x: e.clientX,
		y: e.clientY
	};
	this.trigger(this.canvas, 'moveStart');
};

Comparator.prototype.mousemove = function (e) {
	var offset = this.canvas.getBoundingClientRect();

	this.cur = {
		x: e.clientX - offset.left,
		y: e.clientY - offset.top
	};

	if (!this.isMoving) {
		this.draw();
	}
	else {
		this.tmpPos = {
			x: this.pos.x,
			y: this.pos.y
		};

		this.tmpPos.x -= (this.isMoving.x - e.clientX);
		this.tmpPos.y -= (this.isMoving.y - e.clientY);

		this.draw(this.tmpPos);
	}
};
Comparator.prototype.mouseup = function (e) {
	if (this.tmpPos) {
		this.pos.x = this.tmpPos.x;
		this.pos.y = this.tmpPos.y;
	};
	if (this.isMoving) {
		this.isMoving = null;
		this.tmpPos = null;
		this.trigger(this.canvas, 'moveEnd');
	};
};


// c.addEventListener('mouseleave', mouseleave);
