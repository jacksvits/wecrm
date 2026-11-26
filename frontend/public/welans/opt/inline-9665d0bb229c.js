(function ($) {

  var saper = [];
  var mines = [];
  var mines_num = 10;
  var saper_canvas = false;
  var saper_size = 45;
  var particles = [];
  var saper_level = 'low';
  var saper_col = 10;
  var saper_line = 8;
  var saper_first_click = 0;
  var saper_playing = null;
  var saper_flags = 0;
  var saper_timer = null;
  var saper_die = 0;
  var saper_die_timer = null;
  $(document).ready(function () {
	saper_canvas = $('#saper').get(0);
	if (typeof saper_canvas !== 'undefined') {
	  $('.saper-level select').trigger('change');
	}

  });
  $(document).on('change', '.saper-level select', function () {

	saper_level = $(this).val();
	if (saper_level === 'hig') {
	  saper_col = 24;
	  saper_line = 20;
	  mines_num = 99;
	  saper_flags = 99;
	  saper_size = 25;
	} else if (saper_level === 'med') {
	  saper_col = 18;
	  saper_line = 14;
	  mines_num = 40;
	  saper_size = 30;
	  saper_flags = 40;
	} else if (saper_level === 'low') {
	  saper_col = 10;
	  saper_line = 8;
	  mines_num = 10;
	  saper_size = 45;
	  saper_flags = 10;
	}

	$('.saper').removeClass('low hig med').addClass(saper_level);
	saper_start();
  });
  function saper_start() {

	saper_canvas = $('#saper').get(0);
	if (typeof saper_canvas !== 'undefined') {

	  saper = [];
	  mines = [];
	  particles = [];
	  saper_first_click = 0;
	  saper_die = 0;
	  clearInterval(saper_die_timer);
	  init_saper();
	  saper_control();
	  update_canvas();
	  saper_timer_control();
	}
  }

  function saper_control() {

	saper_canvas.onmousemove = function (e) {
	  var rect = this.getBoundingClientRect(),
			  x = e.clientX - rect.left,
			  y = e.clientY - rect.top,
			  i = 0;
	  while (saper[i]) {
		var j = 0;
		while (saper[i][j]) {
		  if (x > saper[i][j].x && x < saper[i][j].x + saper_size && y > saper[i][j].y && y < saper[i][j].y + saper_size) {
			saper[i][j].hover = 1;
		  } else {
			saper[i][j].hover = 0;
		  }
		  j++;
		}

		i++;
	  }
	};
	saper_canvas.onmouseout = function (e) {
	  var old_interval = saper_playing;
	  setTimeout(function () {
		clearInterval(old_interval);
		if (!$('.saper .saper-upd').hasClass('active')) {
		  $('.saper .saper-upd').removeClass('active clear').addClass('stop');
		}
	  }, 2000);
	  $('.saper .saper-upd').removeClass('active stop').addClass('clear');
	};
	saper_canvas.onmouseenter = function (e) {
	  saper_playing = setInterval(update_canvas, 1000 / 30);
	  $('.saper .saper-upd').removeClass('stop clear').addClass('active');
	};
	saper_canvas.oncontextmenu = function (e) {
	  e.preventDefault();
	};
	saper_canvas.onmousedown = function (e) { // обрабатываем клики мышью
	  var rect = this.getBoundingClientRect(),
			  x = e.clientX - rect.left,
			  y = e.clientY - rect.top;
	  var col = Math.floor(x / saper_size);
	  var line = Math.floor(y / saper_size);
	  if (saper[line][col].ishide === 0) {
		return;
	  }
	  if (e.button !== 0) {
		if (e.button === 2) {
		  if (saper[line][col].flag === 1) {
			saper[line][col].flag = 0;
			saper_flags += 1;
		  } else {
			saper[line][col].flag = 1;
			saper_flags -= 1;
		  }
		  $('.saper .saper-flags .saper-flags-count').text(saper_flags);
		  return;
		}
		return;
	  }

	  if (saper_first_click === 0) {

		init_saper_mines(col, line);
		saper_first_click = 1;
		saper_timer_control();
		$('.saper .saper-content').removeClass('shake').addClass('shake');
	  }

	  saper_click(col, line);
	};
  }

  function saper_timer_control() {
	if (typeof saper_timer !== null) {
	  var old_timer = saper_timer;
	  clearInterval(old_timer);
	  $('.saper .saper-timer-count').text(0);
	}
	if (saper_first_click === 1) {
	  saper_timer = setInterval(function () {
		var time = parseInt($('.saper .saper-timer-count').text());
		$('.saper .saper-timer-count').text(time + 1);
	  }, 1000);
	}
  }

  function saper_click(col, line) {

	if (saper[line][col].flag === 1) {
	  return;
	}
	if (saper[line][col].type === 9) {
	  saper_die = 1;
	  saper_loose();
	  return;
	}

	if (saper[line][col].type === 0) {
	  saper_click_empty(col, line);
	} else {
	  saper[line][col].ishide = 0;
	  particles.push({
		x: col * saper_size,
		y: line * saper_size,
		counter: 0,
		destroy: 0
	  });
	  if (saper[line][col].flag === 1) {
		saper[line][col].flag = 0;
		saper_flags += 1;
		$('.saper .saper-flags .saper-flags-count').text(saper_flags);
	  }
	}

  }


  function saper_click_empty(col, line) {
//метим текущую ячейку
	saper[line][col].ishide = 0;
	particles.push({
	  x: col * saper_size,
	  y: line * saper_size,
	  counter: 0,
	  destroy: 0
	});
	if (saper[line][col].flag === 1) {
	  saper[line][col].flag = 0;
	  saper_flags += 1;
	  $('.saper .saper-flags .saper-flags-count').text(saper_flags);
	}

//если текущая ячейка не пустая, то не открываем соседние
	if (saper[line][col].type !== 0) {
	  return;
	}



//верх
	if (line > 0) {
	  if (col > 0) {
//лево верх
		if (saper[line - 1][col - 1].ishide === 1 && saper[line - 1][col - 1].type === 0) {

		  saper_click_empty(col - 1, line - 1);
		} else if (saper[line - 1][col - 1].ishide === 1 && saper[line - 1][col - 1].type !== 9) {
		  saper[line - 1][col - 1].ishide = 0;
		  if (saper[line - 1][col - 1].flag === 1) {
			saper[line - 1][col - 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col - 1) * saper_size,
			y: (line - 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
//центр верх
	  if (saper[line - 1][col].ishide === 1 && saper[line - 1][col].type === 0) {

		saper_click_empty(col, line - 1);
	  } else if (saper[line - 1][col].ishide === 1 && saper[line - 1][col].type !== 9) {
		saper[line - 1][col].ishide = 0;
		if (saper[line - 1][col].flag === 1) {
		  saper[line - 1][col].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col) * saper_size,
		  y: (line - 1) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

//право верх
	  if (col < saper_col - 1) {
		if (saper[line - 1][col + 1].ishide === 1 && saper[line - 1][col + 1].type === 0) {
		  saper_click_empty(col + 1, line - 1);
		} else if (saper[line - 1][col + 1].ishide === 1 && saper[line - 1][col + 1].type !== 9) {
		  saper[line - 1][col + 1].ishide = 0;
		  if (saper[line - 1][col + 1].flag === 1) {
			saper[line - 1][col + 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col + 1) * saper_size,
			y: (line - 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
	}

//на уровне слева
	if (col > 0) {
	  if (saper[line][col - 1].ishide === 1 && saper[line][col - 1].type === 0) {

		saper_click_empty(col - 1, line);
	  } else if (saper[line][col - 1].ishide === 1 && saper[line][col - 1].type !== 9) {
		saper[line][col - 1].ishide = 0;
		if (saper[line][col - 1].flag === 1) {
		  saper[line][col - 1].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col - 1) * saper_size,
		  y: (line) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

	}

//на уровне справа
	if (col < saper_col - 1) {
	  if (saper[line][col + 1].ishide === 1 && saper[line][col + 1].type === 0) {
		saper_click_empty(col + 1, line);
	  } else if (saper[line][col + 1].ishide === 1 && saper[line][col + 1].type !== 9) {
		saper[line][col + 1].ishide = 0;
		if (saper[line][col + 1].flag === 1) {
		  saper[line][col + 1].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col + 1) * saper_size,
		  y: (line) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }


	}

//низ
	if (line < saper_line - 1) {
	  if (col > 0) {
//лево низ
		if (saper[line + 1][col - 1].ishide === 1 && saper[line + 1][col - 1].type === 0) {

		  saper_click_empty(col - 1, line + 1);
		} else if (saper[line + 1][col - 1].ishide === 1 && saper[line + 1][col - 1].type !== 9) {
		  saper[line + 1][col - 1].ishide = 0;
		  if (saper[line + 1][col - 1].flag === 1) {
			saper[line + 1][col - 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col - 1) * saper_size,
			y: (line + 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
//центр низ
	  if (saper[line + 1][col].ishide === 1 && saper[line + 1][col].type === 0) {

		saper_click_empty(col, line + 1);
	  } else if (saper[line + 1][col].ishide === 1 && saper[line + 1][col].type !== 9) {
		saper[line + 1][col].ishide = 0;
		if (saper[line + 1][col].flag === 1) {
		  saper[line + 1][col].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col) * saper_size,
		  y: (line + 1) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

//право низ
	  if (col < saper_col - 1) {
		if (saper[line + 1][col + 1].ishide === 1 && saper[line + 1][col + 1].type === 0) {

		  saper_click_empty(col + 1, line + 1);
		} else if (saper[line + 1][col + 1].ishide === 1 && saper[line + 1][col + 1].type !== 9) {
		  saper[line + 1][col + 1].ishide = 0;
		  if (saper[line + 1][col + 1].flag === 1) {
			saper[line + 1][col + 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col + 1) * saper_size,
			y: (line + 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
	}

	$('.saper .saper-flags .saper-flags-count').text(saper_flags);
  }

  function init_saper_mines(num_col, num_line) {
	var click_cell = (num_line * saper_col) + num_col;
	click_cell = [
	  click_cell,
	  click_cell + 1,
	  click_cell - 1,
	  click_cell + saper_col - 1,
	  click_cell + saper_col,
	  click_cell + saper_col + 1,
	  click_cell - saper_col - 1,
	  click_cell - saper_col,
	  click_cell - saper_col + 1
	];
	var total_cell = [];
	for (var i = 0; i < saper_line * saper_col; i += 1) {
	  if ($.inArray(i, click_cell) === -1) {
		total_cell.push(i);
	  }
	}
	var rand_cell = saper_rand(mines_num, 0, total_cell.length);
	mines = [];
	$(rand_cell).each(function (index, val) {
	  mines.push(total_cell[val]);
	});
	var num = 0;
	$(saper).each(function (l_index, l_obj) {
	  $(l_obj).each(function (c_index, c_obj) {
		if ($.inArray(num, mines) !== -1) {
		  saper[l_index][c_index].type = 9;
		}

		num++;
	  });
	});
	saper_update_type();
  }

  function init_saper() {
	$('.saper #saper').attr({width: saper_col * saper_size, height: saper_line * saper_size});
	$('.saper .saper-flags .saper-flags-count').text(saper_flags);
	var num = 0, line = 0, txt = 0;
	for (var y = 0; y < saper_line * saper_size; y += saper_size) {
	  saper.push([]);
	  for (var x = 0; x < saper_col * saper_size; x += saper_size) {
		saper[line].push({type: 0, x: x, y: y, hover: 0, ishide: 1, flag: 0});
		num++;
	  }

	  line++;
	}
  }

  function saper_user_win() {
	if(saper_die === 1) {
	  return false;
	}
	var sec = parseInt($('.saper .saper-timer-count').text());
	var dif = saper_level;
	saper_send_result(sec, dif);
	saper_show_result(sec, dif);

	$('.saper-level select').trigger('change');

  }

  function saper_update_type() {
	$(saper).each(function (line, line_obj) {
	  $(line_obj).each(function (col, col_obj) {
		if (col_obj.type !== 9) {
		  return true;
		}

//Если есть линия выше
		if (typeof saper[line - 1] !== 'undefined') {
		  if (col > 0 && col < saper_col - 1) {
//лево верх
			if (saper[line - 1][col - 1].type !== 9) {
			  saper[line - 1][col - 1].type += 1;
			}
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
//право верх
			if (saper[line - 1][col + 1].type !== 9) {
			  saper[line - 1][col + 1].type += 1;
			}
		  } else if (col === 0) {
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
//право верх
			if (saper[line - 1][col + 1].type !== 9) {
			  saper[line - 1][col + 1].type += 1;
			}
		  } else if (col === saper_col - 1) {
//лево верх
			if (saper[line - 1][col - 1].type !== 9) {
			  saper[line - 1][col - 1].type += 1;
			}
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
		  }
		}


//на уровне мины
		if (col > 0 && col < saper_col - 1) {
		  if (saper[line][col - 1].type !== 9) {
			saper[line][col - 1].type += 1;
		  }
		  if (saper[line][col + 1].type !== 9) {
			saper[line][col + 1].type += 1;
		  }
		} else if (col === 0) {
		  if (saper[line][col + 1].type !== 9) {
			saper[line][col + 1].type += 1;
		  }

		} else if (col === saper_col - 1) {
		  if (saper[line][col - 1].type !== 9) {
			saper[line][col - 1].type += 1;
		  }
		}

//линией ниже
		if (typeof saper[line + 1] !== 'undefined') {
		  if (col > 0 && col < saper_col - 1) {
//лево низ
			if (saper[line + 1][col - 1].type !== 9) {
			  saper[line + 1][col - 1].type += 1;
			}
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
//право низ
			if (saper[line + 1][col + 1].type !== 9) {
			  saper[line + 1][col + 1].type += 1;
			}
		  } else if (col === 0) {
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
//право низ
			if (saper[line + 1][col + 1].type !== 9) {
			  saper[line + 1][col + 1].type += 1;
			}
		  } else if (col === saper_col - 1) {
//лево низ
			if (saper[line + 1][col - 1].type !== 9) {
			  saper[line + 1][col - 1].type += 1;
			}
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
		  }
		}




	  });
	});
  }

  function update_canvas() {
	var ctx = saper_canvas.getContext("2d");
	var i = 0;
	var j = 0;
	var hide_count = 0;
	$(saper).each(function (line, line_val) {
	  $(line_val).each(function (col, col_val) {
		if (col_val.ishide === 1) {
		  hide_count += 1;
		  if ((i + j) % 2 === 0) {
			var def_color = "#aad751";
		  } else {
			var def_color = "#a2d149";
		  }
		} else {
		  if ((i + j) % 2 === 0) {
			var def_color = "#e5c29f";
		  } else {
			var def_color = "#d7b899";
		  }
		}

		ctx.beginPath();
		ctx.fillStyle = def_color;
		ctx.rect(col_val.x, col_val.y, saper_size, saper_size);
		ctx.fill();
		if (col_val.hover === 1 && (col_val.type !== 0 || col_val.ishide === 1)) {
		  ctx.beginPath();
		  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
		  ctx.rect(col_val.x, col_val.y, saper_size, saper_size);
		  ctx.fill();
		}


		if (col_val.flag === 1) {
		  ctx.beginPath();
		  ctx.font = "28px rcl-awesome";
		  ctx.fillStyle = "red";
		  ctx.textAlign = "center";
		  ctx.textBaseline = "middle";
		  ctx.fillText("\uf024", col_val.x + saper_size / 2, col_val.y + saper_size / 2);
		}

		if (col_val.ishide === 0) {

		  if (col_val.type === 9) {
			ctx.beginPath();
			ctx.fillStyle = "black";
			ctx.arc(col_val.x + saper_size / 2, col_val.y + saper_size / 2, saper_size / 2, 0, 360, false);
			ctx.fill();
		  } else if (col_val.type === 0) {
		  } else if (col_val.type !== 9) {
			switch (col_val.type) {
			  case 1:
				var txt_color = "blue";
				break;
			  case 2:
				var txt_color = "green";
				break;
			  case 3:
				var txt_color = "red";
				break;
			  default:
				var txt_color = "#673AB7";
			}
			ctx.beginPath();
			var font_size = (saper_size > 40) ? 40 : saper_size;
			ctx.font = 'bold ' + font_size + 'px serif';
			ctx.fillStyle = txt_color;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(col_val.type, col_val.x + saper_size / 2, col_val.y + 2 + saper_size / 2);
		  }

		}
		i++;
	  });
	  j++;
	});
	if (hide_count === mines_num) {
	  saper_user_win();
	}
	var len = particles.length;
	for (i = 0; i < len; i++) {

	  var particle = particles[i];
	  if (typeof particle === 'undefined') {
		continue;
	  } else if (particle.counter === 10) {
		particles.splice(i, 1);
		continue;
	  }

	  if (typeof particle.to === 'undefined') {
		var rnd = parseInt(Math.random() * 100);
		if (rnd % 2 === 0) {
		  particle.to = 1;
		} else {
		  particle.to = -1;
		}
		particles[i].to = particle.to;
	  }

	  var rand_x = particle.counter / Math.sin(particle.to);
	  var rand_y = particle.counter / Math.sin(particle.to);

	  ctx.beginPath();
	  ctx.globalAlpha = 1 - particle.counter / 10;
	  ctx.fillStyle = "#9cd03a";
	  ctx.rect(particle.x - rand_x, particle.y + rand_y, saper_size - particle.counter, saper_size - particle.counter);
	  ctx.fill();
	  ctx.setTransform(1, 0, 0, 1, 0, 0);
	  ctx.globalAlpha = 1;
	  particles[i].counter += 1;
	}


  }

  function saper_rand(c, l, h) {
	var count = c,
			min = l,
			max = h,
			nums = {},
			out = [],
			r, len = 0;
	if (max - min < count)
	  count = max - min;
	var getRand = function () {
	  return Math.floor(Math.random() * (max - min) + min);
	}, check = function (a) {
	  return nums[a];
	}, add = function (a) {
	  nums[a] = 1;
	  out.push(a);
	  len++;
	};
	(function init() {
	  while (len < count) {
		if (len == 0)
		  r = getRand();
		else
		  while (check(r = getRand()))
			;
		add(r);
	  }
	})();
	return out;
  }

  $(document).on('click', '.saper .saper-overlay', function () {

	$(this).next().hide().html('');
	$(this).hide();

	if (saper_die === 1) {
	  $('.saper-level select').trigger('change');
	}

  });

  $(document).on('click', '.saper .saper-records', function () {

	$.post(Rcl.ajaxurl, {
	  action: 'saper_get_result_ajax',
	  dif: saper_level
	}, function (result) {
	  if (result.content) {
		$('.saper .saper-overlay, .saper .saper-overlay-content').show();
		$('.saper .saper-overlay-content').html('').html(result.content);
	  }

	});
	return false;

  });

  function saper_send_result(sec, dif) {

	$.post(Rcl.ajaxurl, {
	  action: 'saper_upd_result_ajax',
	  sec: sec,
	  dif: dif
	}, function (result) {
	  if (result.content) {
		rcl_notice('Сохранено', 'success', 3000);
	  } else {
		rcl_notice(result.error, 'error', 3000);
	  }

	});
	return false;
  }

  function saper_show_result(sec, dif) {
	$('.saper .saper-overlay, .saper .saper-overlay-content').show();
	$('.saper .saper-overlay-content').html('<div><h3>Поздравляем</h3><div>Вы справились за ' + sec + 'сек.</div></div>');
  }

  function saper_loose() {
	$('.saper .saper-overlay, .saper .saper-overlay-content').show();
	$('.saper .saper-overlay-content').html('<div><h3>Вы подорвались на мине!</h3><div>Попробуйте еще раз</div></div>');

	saper_die_timer = setInterval(function () {
	  $(saper).each(function (lindex, line_obj) {
		$(line_obj).each(function (cindex, col_obj) {
		  if (saper[lindex][cindex].ishide === 1) {
			saper[lindex][cindex].ishide = 0;
			particles.push({
			  x: (cindex) * saper_size,
			  y: (lindex) * saper_size,
			  counter: 0,
			  destroy: 0
			});
			if(typeof saper[lindex][cindex + 1] === 'undefined' && typeof saper[lindex + 1] === 'undefined') {
			  clearInterval(saper_die_timer);
			}
			return false;
		  }
		});
	  });
	}, 50);

  }


})(jQuery);