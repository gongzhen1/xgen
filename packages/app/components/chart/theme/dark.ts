export default {
	darkMode: true,
	aria: {
		decal: { show: true }
	},
	tooltip: {
		textStyle: {
			color: '#a2a5b9',
			fontSize: 12
		},
		backgroundColor: '#232326',
		borderRadius: 6
      },
      legend: {
		orient: 'vertical',
		left: 'left',
		top: 'middle',
		itemWidth: 15,
		itemHeight: 9,
		textStyle: {
			color: '#a2a5b9',
			fontSize: 12
		}
      },
      grid: {
            top: '8%',
            bottom: '4%',
            left: '2%',
            right: '2%',
            containLabel: true,
            show: false
      },
	color: [
		'#4992ff',
		'#7cffb2',
		'#fddd60',
		'#ff6e76',
		'#58d9f9',
		'#05c091',
		'#ff8a45',
		'#8d48e3',
		'#dd79ff'
	],
	backgroundColor: 'transparent',
	axisPointer: {
		lineStyle: {
			color: '#817f91'
		},
		crossStyle: {
			color: '#817f91'
		},
		label: {
			color: '#fff'
		}
	},
	textStyle: {
		color: '#B9B8CE'
	},
	title: {
		textStyle: {
			color: '#EEF1FA'
		},
		subtextStyle: {
			color: '#B9B8CE'
		}
	},
	toolbox: {
		iconStyle: {
			borderColor: '#B9B8CE'
		}
	},
	dataZoom: {
		borderColor: '#71708A',
		textStyle: {
			color: '#B9B8CE'
		},
		brushStyle: {
			color: 'rgba(135,163,206,0.3)'
		},
		handleStyle: {
			color: '#353450',
			borderColor: '#C5CBE3'
		},
		moveHandleStyle: {
			color: '#B0B6C3',
			opacity: 0.3
		},
		fillerColor: 'rgba(135,163,206,0.2)',
		emphasis: {
			handleStyle: {
				borderColor: '#91B7F2',
				color: '#4D587D'
			},
			moveHandleStyle: {
				color: '#636D9A',
				opacity: 0.7
			}
		},
		dataBackground: {
			lineStyle: {
				color: '#71708A',
				width: 1
			},
			areaStyle: {
				color: '#71708A'
			}
		},
		selectedDataBackground: {
			lineStyle: {
				color: '#87A3CE'
			},
			areaStyle: {
				color: '#87A3CE'
			}
		}
	},
	visualMap: {
		textStyle: {
			color: '#B9B8CE'
		}
	},
	timeline: {
		lineStyle: {
			color: '#B9B8CE'
		},
		label: {
			color: '#B9B8CE'
		},
		controlStyle: {
			color: '#B9B8CE',
			borderColor: '#B9B8CE'
		}
	},
	calendar: {
		itemStyle: {
			color: '#100C2A'
		},
		dayLabel: {
			color: '#B9B8CE'
		},
		monthLabel: {
			color: '#B9B8CE'
		},
		yearLabel: {
			color: '#B9B8CE'
		}
	},
	timeAxis: {
		axisLine: {
			lineStyle: {
				color: '#B9B8CE'
			}
		},
		splitLine: {
			lineStyle: {
				color: '#484753'
			}
		},
		splitArea: {
			areaStyle: {
				color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
			}
		},
		minorSplitLine: {
			lineStyle: {
				color: '#20203B'
			}
		}
	},
	logAxis: {
		axisLine: {
			lineStyle: {
				color: '#B9B8CE'
			}
		},
		splitLine: {
			lineStyle: {
				color: '#484753'
			}
		},
		splitArea: {
			areaStyle: {
				color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
			}
		},
		minorSplitLine: {
			lineStyle: {
				color: '#20203B'
			}
		}
	},
	valueAxis: {
		axisLine: {
			lineStyle: {
				color: '#B9B8CE'
			}
		},
		splitLine: {
			lineStyle: {
				color: '#484753'
			}
		},
		splitArea: {
			areaStyle: {
				color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
			}
		},
		minorSplitLine: {
			lineStyle: {
				color: '#20203B'
			}
		}
	},
	categoryAxis: {
		axisLine: {
			lineStyle: {
				color: '#B9B8CE'
			}
		},
		splitLine: {
			lineStyle: {
				color: '#484753'
			}
		},
		splitArea: {
			areaStyle: {
				color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
			}
		},
		minorSplitLine: {
			lineStyle: {
				color: '#20203B'
			}
		}
	},
	line: {
		itemStyle: {
			borderWidth: '2'
		},
		lineStyle: {
			width: '2'
		},
		symbolSize: '6',
		symbol: 'emptyCircle',
		smooth: true
      },
      radar: {
		itemStyle: {
			borderWidth: '2'
		},
		lineStyle: {
			width: '2'
		},
		symbolSize: '6',
		symbol: 'emptyCircle',
		smooth: true
	},
	graph: {
		color: [
			'#4992ff',
			'#7cffb2',
			'#fddd60',
			'#ff6e76',
			'#58d9f9',
			'#05c091',
			'#ff8a45',
			'#8d48e3',
			'#dd79ff'
		]
	},
	gauge: {
		title: {
			color: '#B9B8CE'
		}
	},
	candlestick: {
		itemStyle: {
			color: '#FD1050',
			color0: '#0CF49B',
			borderColor: '#FD1050',
			borderColor0: '#0CF49B'
		}
	}
}