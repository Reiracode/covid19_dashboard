const today = new Date().toISOString().substring(0, 10);
const loading = document.getElementById("loading");
// --------------------------------------------------
// map json  d3.json() 讀取外部地圖檔 total_deaths
const topotw_map = d3.json('json/taiwan.geojson');

const getOwiddata = async () => {
  // const api = 'json/owid-covid-data.json';
  // const api = 'https://covid.ourworldindata.org/data/owid-covid-data.json'
  const api = 'json/local_covid_data.json';
  const response = await fetch(api);
  const json = await response.json();

  // world data各國日期區間的資料
  const selectedCountry = ['JPN', 'TWN', 'KOR', 'USA', 'THA', 'ITA'];
  const filteredCountry = json
  // const filteredCountry = Object.keys(json)
  // 	.filter(key => selectedCountry.includes(key))
  // 	.reduce((obj, key) => {
  // 		console.log(obj)
  // 		obj[key] = (json[key].data).filter(item =>
  // 			item.date >= '2022-04-20' & item.date <= '2022-07-28'
  // 		);
  // 		return obj;
  // 	}, {});

  return filteredCountry;
};

// 感染数 日期a01+今日確診数a06+1週間平均a07
const getComfirms = async () => {
  const api = 'json/4048.json';
  // const api = 'https://covid19-db-20602-default-rtdb.firebaseio.com/4048.json';
  const res = await fetch(api);
  const json = await res.json();
  return json.filter((item) => {
    return (item.a01 >= '2022-04-20' & item.a01 <= '2022-07-27')
  }).reverse();
};

//縣市鄉鎮疫情表單 感染数 日期:a01+今日確診数:a06+1週間平均:a07 取二個月
const getApiCity = async () => {
  const api = 'json/5002.json';
  // const api = 'https://covid19-db-20602-default-rtdb.firebaseio.com/5002.json';
  const res = await fetch(api);
  const json = await res.json();
  const data = json.filter((item) => {
    return (item.a01 >= '2022-04-20') && (item.a04 == '全區' & item.a01 <= '2022-07-27');
  });

  // document.getElementById("result-before").innerHTML = JSON.stringify(data);

  return data;
  // return json.filter((item) => {
  // 	return (item.a01 >= '2022-04-20') && (item.a04 == '全區' & item.a01 <= '2022-07-20	');
  // });


};

function renderMap(mapData, apidata) {
  const widths = document.querySelector('.header').offsetWidth;
  document.querySelector('#map').width = widths;

  const width = 700;
  const height = 900;
  let centered;

  // 使用 topojson 將 TopoJSON 格式轉換為 GeoJSON 格式
  // const states = topojson.feature(mapData, mapData.objects.COUNTY_MOI_1090820);
  // geojson
  const states = mapData;
  console.log(states)

  const projection = d3.geoIdentity().reflectY(true)
    .fitSize([width, height], states)

  const svg = d3.select("body").select("svg")
    .attr('viewBox', `0 0 ${width} ${height}`)
  // .attr('width', `${width }`)
  // .attr('height', `${height}`)

  // 生成 geoPath 物件，內容是地圖的外框座標
  const path = d3.geoPath().projection(projection);

  // const mapinfo = states;
  const mapinfo = states.features;
  console.log(mapinfo)

  // 合併two array
  const newmergeobj = (arr1, arr2) => {
    // find OR filter  all arr2 value copy to arr1
    return arr1.map(obj => {
      arr2.filter(o => {
        if (o.a03.replace(/台/g, '臺') === obj.properties.COUNTYNAME) {
          //單一key,value
          // return obj.properties.confirmed = o.a06;
          return Object.assign(obj.properties, o);
        }
      });
      return obj;
    })
  };
  newmergeobj(mapinfo, apidata);
  // 合併地圖and各區確診數
  // const result2 = newmergeobj(mapinfo, apidata);
  // console.log(result2);
  // ************************************
  // 	 color define
  const domain = [150000, 300000, 450000, 600000, 750000, 850000]
  const labels = ["< 100 K ", "100 - 150 K", "150 - 200 K", "200 - 300 K", "300 - 600 K", "> 600 K"]
  const margin = { top: 5, bottom: 5, left: 5, right: 5 };
  const colorRange = ["#adade0", "#8080a8", "#aea3c3", "#a88cb5", "#6785b3", "#aabae4", "#a985c3"]

  //  #a985c3 #691960 #a88cb5;
  const colorScale = d3.scaleOrdinal()
    .domain(domain)
    // .range(d3.schemePuRd[7])
    .range(colorRange)

  console.log(colorScale)

    //create div for the legend to go in
  const legend_x = width - 120
  const legend_y = height - 330

  const legend = d3.select('#legend')
    .append('div')
    .style('display', 'flex')
    .style('font-family', 'sans-serif')
    .attr("transform", "translate	(" + legend_x + "," + legend_y + ")");

  // create one div for each entry in the color scale
  const cell = legend.selectAll('div')
    .data(colorScale.domain())
    .join('div')
    .attr('class', 'map-class') 

  // // add the colored square for each entry
  cell.append('div')
    .style('background', d => {
      return colorScale(d)
    })
    .style('min-width', '14px')
    .style('min-height', '14px')
    .style('margin-right', '0.5em');

  // // add the text label for each entry
  cell.append('div')
    .text(d => d);

  // ************************************		
  svg.selectAll("path")
    .data(states.features)
    .enter()
    .append("path")
    .attr("class", "topo")
    .attr("d", path)
    .attr("data-city", (d) => {
      return d.properties.COUNTYNAME
    } )
    // .style("opacity", .5)
    .attr(`stroke`, `#666`)
    .attr(`stroke`, `#fff`)
    .attr(`stroke-width`, `1.2pt`)
    .attr("fill", function (d) {
      // return colorScale(d.total);
      d.total = d.properties.a06 || 0;
      const scolor = Math.floor(d.total / 150000)
      return colorScale(domain[scolor]);
    })
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave)

  console.log(states.features)
  const texts = svg.selectAll('text')
    .data(states.features)
    .enter()
    .append('text')
    .attr('x', (d, i) => {
      // console.log(d)
      // let centroid = path.centroid(d);
      return path.centroid(d)[0]
    })
    .attr('y', (d, i) => {
      // let centroid = path.centroid(d);
      return path.centroid(d)[1]
    })
    // .attr('text-anchor', 'middle')
    .attr('text-anchor', (d, i) => {
      if (d.properties.COUNTYNAME == '嘉義市' || d.properties.COUNTYNAME == '台北市') {
        return 'end'
      } else {
        return 'middle'
      }
    })
    .attr('font-size', '1.4rem')
    .attr('stroke', '#000')
    .text((d, i) => {
      console.log(d.properties.COUNTYNAME)
      //  return d3.format(",.2r")(d.properties.a06)

      return (d.properties.COUNTYNAME)
    })
    
  // d3.select("svg").append("line")
  //   .attr({ "x1": 20, "y1": 20, "x2": 250, "y2": 250 })
  //   .style("stroke", "red")
  //   .style("stroke-width", "4px");
  
  
  
}


//box2 今日各市確診人數
function showCityDesc(arr) {
  console.log(arr)
  const tempArr1 = ['x'];
  const tempArr2 = ['num'];
  
  Object.values(arr.sort((a, b) => {
    return b.a05 - a.a05
  })).filter(item => item.a03 != '境外移入')
    .forEach(item => {
      tempArr1.push(item.a03);
      tempArr2.push(item.a05);
    })
  console.log(tempArr1)
  console.log(tempArr2)

  // const [fromX, toX] = Object.values(todays)
  // 	.filter(item => item.a03 != '境外移入')
  // 	.reduce(([a, b], todays) => {
  // 		a.push(arr.a03);
  // 		b.push(arr.a05);
  // 		return [a, b];
  // 	}, [['x'], ['num']]);

  // console.log(fromX);
  // console.log(toX);

  // --------------
  const chart = c3.generate({
    bindto: "#chartcitydesc",
    data: {
      x: 'x',
      columns: [
        // arr
        tempArr1, tempArr2
      ],
      names: {
        'num': '確診數量'
      },
      type: 'bar',
      colors: {
        'num': '#adade0'
      }
    },
    size: {
      height: arr.length * 25,
    },
    axis: {
      rotated: true,
      x: {
        show: true,
        type: "category",
        label: {
          text: "city",
          position: 'outer-middle'
        },
        height: 130
      },
      y: {
        tick: {
          // count: 6,
          // values: [1000, 3000, 5000],

          // rotate: 35
          rotate: 90
        },
        show: true,
      }
    }
  });


}

//box3 確診人數縣市比例 
function showCityPercent(arr) {
  console.log(arr)
  const newArr1 = Object.values(arr.sort((a, b) => {
    return b.a05 - a.a05
  }).slice(0, 7)).map((item) => {
    const tempArr1 = [];
    tempArr1.push(item.a03);
    tempArr1.push(item.a05);
    return tempArr1;
  });

  const chart = c3.generate({
    bindto: "#piechart",
    data: {
      columns: newArr1,
      type: 'pie',
    },
    pie: {
      order: 'desc'
    }
  });


}

//box4
function renderWorld(arr) {
  console.log(arr)
  console.log(arr[0].length)
  const chartworld = c3.generate({
    bindto: "#chartworld",
    size: {
      height: 340
    },
    data: {
      x: 'date',
      columns: arr,
      names: {
        JPN: 'JPN',
        TWN: 'TWN',
        KOR: 'KOR',
        USA: 'USA',
        THA: 'THA',
        ITA: 'ITA'
      },
      // colors: {
      // 	JPN: '#be1b19',
      // 	TWN: '#ff9c38',
      // 	KOR: '#06ac4e',
      // 	USA: 'purple',
      // 	THA: 'red',
      // 	ITA: 'pink'
      // }
      type: `spline`
    },
    axis: {
      x: {
        show: true,
        type: 'timeseries',
        label: {
          text: 'date',
          position: "outer-middle" //名稱位置
        },
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      y: {
        show: true,
        label: {
          text: "per-millon",
          position: "outer-middle", //名稱位置
        },
        //  padding: { top: 0, bottom: 0, left: 10, right: 10 },
      },
      // "y2": {
      //   "show": true,
      //   "label": {
      //     "text": "date",
      //     "position": "outer-middle"
      //   },
      //   "min": 0,
      //   "tick": {}
      // }

    },
    grid: {
      y: {
        show: true
      }
    }
  });



}

//選擇各市感染數走勢box5
function showCity(arr) {
  console.log(arr)

  let tempDate = ['x'];
  let tempObj = ['Confirmed Cases'];

  arr.forEach(item => {
    tempDate.push(item.a01);
    tempObj.push(item.a05);
  });

  console.log(tempObj)
  console.log(tempDate)

  // --------------
  const chartcity = c3.generate({
    bindto: "#chartcity",
    size: {
      height: 340
    },
    data: {
      x: 'x',
      columns: [
        tempObj,
        tempDate
      ]
    },
    color: {
      pattern: ['#4677c2']
    },
    axis: {
      x: {
        type: 'timeseries',
        label: {
          text: 'date',
          position: "outer-middle" //名稱位置
        }
      },
      // y: {
      //   show: true,
      //   label: {
      //     text: "Confirmed Cases",
      //     position: "outer-middle", //名稱位置
      //   },
      // }
    }
  });



}

// 感染數/死亡數/	box6
function showAverage(arr) {
  console.log(arr)
  //  日期: a01 + 今日確診数: a06 + 1週間平均:a07 取二個月  new_deaths
  let tempDate = ['x'];
  let tempDeaths = ['deceased'];
  let tempObj = ['confirm'];
  let tempWeek = ['weekly'];

  //  
  arr.forEach(item => {
    tempDate.push(item.a01);
    tempObj.push(item.a06);
    tempWeek.push(item.a07);
    tempDeaths.push(item.new_deaths);
  });

  console.log(tempDeaths)
  // --------------
  const chart2 = c3.generate({
    bindto: "#chart2",
    size: {
      height: 340
    },
    data: {
      x: 'x',
      columns: [
        tempDate,
        tempObj,
        tempWeek,
        tempDeaths
      ],
      names: {
        deceased: 'Deceased',
        confirm: 'Confirmed Cases',
        weekly: "Weekly average value"
      },
      axes: {
        tempWeek: 'y',
        deceased: 'y2',
      },
      type: 'bar',
      types: {
        weekly: 'spline',
        deceased: 'spline'
      },
    },
    color: {
      // pattern: ['#4677c2', 'rosybrown', '#7df5e8']
      pattern: ['#4677c2', '#d2b5fb', '#7df5e8']
    },

    axis: {
      x: {
        type: 'timeseries',
        label: {
          text: "date ",
          position: "outer-middle", //名稱位置
        }
      },
      y: {
        show: true,
        label: {
          text: "Confirmed ",
          position: "outer-middle", //名稱位置
        },
      },
      //客製右側 (data2) Y2 軸內容
      y2: {
        show: true,
        label: {
          text: "Deceased",
          position: "outer-middle", //名稱位置
        },
      }
    }
  });


}


//getApi5002 :apidata ==> TODAY 今日城市確診比例，排序  itm.a01 == '2022-07-17') && (itm.a04 == '全區');
//getApiCity :apidata_citys==>CITY TREND  (itm.a01 >= '2022-04-20') && (itm.a04 == '全區');
//apidata_deaths=>globaldata
async function getAlldata() {
  const [mapData, globaldata, apidata_comfirms, apidata_citys] = await Promise.all([topotw_map,
    getOwiddata(), getComfirms(), getApiCity()]);



  // apidata_citys  今日城市確診比例，排序BOX2 BOX3
  const todays = apidata_citys.filter((itm) => {
    return (itm.a01 == '2022-07-27');
  });



  showCityDesc(todays)
  showCityPercent(todays)

  // showCity(groupCountry['台北市'])
  // 下拉選單 選擇縣市
  const select = document.querySelector('.county')
  console.log(select.value)
  // const selcity= document.querySelector('.county').value;
  const groupCountry = apidata_citys.reduce((result, a) => {
    result[a.a03] = result[a.a03] || [];
    result[a.a03].push(a);
    return result;
  }, Object.create(null));

  // 下拉選單
  Object.keys(groupCountry).forEach(key => {
    console.log(key)
    if (key == '台北市') {
      select.innerHTML +=
        `<option value=${key} selected>${key}</option>`;
    } else {
      select.innerHTML +=
        `<option value=${key}>${key}</option>`;
    }
  });

  console.log(groupCountry)
  // 去除重複值
  const result1 = Array.from(new Set(Object.keys(groupCountry)));
  console.log(result1);
  result1.forEach(i => {
    console.log(i)
  })

  select.addEventListener('change', () => {
    changeSelectedCity(groupCountry);
  });

  console.log(groupCountry[select.value])
  showCity(groupCountry[select.value])



  // console.log(apidata)
  console.log(todays)
  // ______________________
  // d3.json() 讀取外部地圖檔
  renderMap(mapData, todays)

  // renderworld
  let twdata = globaldata['TWN'];
  // console.log(twdata)
  // console.log(twdata.slice(-1))

  // ios safari cant worked
  // const deathdata = twdata.findLast((item) => true);
  const deathdata = twdata.slice(-1)[0]
  console.log(deathdata);
  // alert(deathdata)

  // newobj renderworld data:foreach 是值先取key值，jpn，再來取得obj[key],
  let newobj = [];
  let objDate = ['date'];

  // document.getElementById("result-before").innerHTML = JSON.stringify(globaldata);

  Object.keys(globaldata).forEach((key) => {
    let tempObj = [];
    tempObj.push(key);
    globaldata[key].forEach(item => {
      if (item.new_cases !== undefined) {
        tempObj.push(item.new_cases);
      } else {
        tempObj.push(0);
      }
    });
    newobj.push(tempObj)

    if (key == 'TWN') {
      (globaldata[key]).map(item =>
        objDate.push(item.date)
      )
    }
  });
  newobj.push(objDate)
  renderWorld(newobj)

  // 新確診人數 /總死亡人數/總確診人數
  document.getElementById("today_cases").innerHTML = number_format(deathdata.new_cases)
  document.getElementById("total_deaths").innerHTML = number_format(deathdata.total_deaths)
  document.getElementById("total_cases").innerHTML = number_format(deathdata.total_cases)
  document.getElementById("title_date").innerHTML = deathdata.date

  //getComfirms()718, getOwiddata()7/17,
  //合併
  const result3 = concatObj(apidata_comfirms, twdata);
  showAverage(result3)
  loading.style.display = "none";
}

getAlldata();

function changeSelectedCity(data) {
  console.log(data)
  let selecity = document.querySelector(".county").value;
  console.log(selecity)
  showCity(data[selecity])
}

// 合併nd各區確診數 apidata_death	
const concatObj = (arr1, arr2) => {
  // const getDate = (arr) => {
  // 	return arr.findLast((item) => true);
  // }

  // let lastDay;
  // if (arr1.length !==  arr2.length){
  // 		const lastDay = (arr1.length - arr2.length > 0)? getDate(arr2) : getDate(arr1)
  // 		console.log(lastDay)
  // }


  // base on (apidata_comfirms, twdata);
  return arr1.map(obj => {
    arr2.filter(o => {
      if (o.date === obj.a01) {
        return Object.assign(obj, o);
      }
    });
    return obj;
  })

  // return arr2.map(obj => {
  // 		arr1.filter(o => {
  // 			if (o.a01 === obj.date) {
  // 				return Object.assign(obj, o);
  // 			}
  // 		});
  // 		return obj;
  // })

};

// create a tooltip
const tooltip = d3.select("#tooltip")
  .style("opacity", 0)
// .attr("class", "tooltip")

function clicked(d) {
  centered = centered !== d && d;

  const paths = svg.selectAll("path")
    .classed("active", d => d === centered);

  const t0 = projection.translate(),
    s0 = projection.scale();

  let centroid = path.centroid(d);

  svg
    .append("text")
    .text(d.properties.name)
    .style("font-size", 20)
    .style("font-weight", "bold")
    .style("display", "inline")
    .attr("transform", "translate(" + centroid + ")")
    .style("fill", "black")
    .transition()
    .delay(function (d, i) { return 100; });

  d3.select(this).select(function (d) {
    tooltip.select('text').html(d.properties.COUNTYNAME)
    tooltip.style('display', 'block')
  })

  // Re-fit to destination
  // projection.fitSize([800, 800], centered || states);
  projection.fitSize([`${width}`, `${height}`], centered || states);

  // Create interpolators
  const interpolateTranslate = d3.interpolate(t0, projection.translate()),
    interpolateScale = d3.interpolate(s0, projection.scale());

  const interpolator = function (t) {
    projection.scale(interpolateScale(t))
      .translate(interpolateTranslate(t));
    paths.attr("d", path);
  };

  d3.transition()
    .duration(750)
    .tween("projection", function () {
      return interpolator;
    });
}
function mouseOver(d) {
  d3.selectAll(".topo")
    .transition()
    .duration(200)
    .style("opacity", .5)
    // .style("stroke", "#666");

  d3.select(this)
    .transition()
    .duration(200)
    .style("opacity", 1)
    .style("filter", "drop-shadow(2px 4px 6px lightgrey)")

  d.total = (d.properties.a06) || 0;

  tooltip
    .style("opacity", 0.8)
    .html(`<p>${d.properties.COUNTYNAME}</p>
												<p>${d.properties.a01}+今日確診${d.properties.a05}</p>
												<p>累計確診:${d.properties.a06}</p>`)
    .style("left", (d3.event.pageX - 10) + "px")
    .style("top", (d3.event.pageY - 100) + "px");

  d3.select("#annotation")
    .style("opacity", 0)
}
// function mouseOver(d) {
//   d3.selectAll(".topo")
//     .transition()
//     .duration(200)
//     // .style("opacity", .5)
//     // .style("stroke", "#000");

//   d3.select(this)
//     .transition()
//     .duration(200)
//     // .style("opacity", 1)
//     // .style("filter", "drop-shadow(2px 4px 6px lightgrey)")
//     .style("filter", "drop-shadow(12px 12px 14px gray)")
 

//   d.total = (d.properties.a06) || 0;

//   // tooltip
//   tooltip
//     .style("opacity", 0.8)
//     .html(d3.format(",.2r")(d.properties.a06))
//     .style("left", (d3.event.pageX) + "px")
//     .style("top", (d3.event.pageY - 28) + "px");

//   d3.select("#annotation")
//     .style("opacity", 0)


// }

function mouseLeave(d) {
  // let mouseLeave = function (d) {
  d3.selectAll(".topo")
    .transition()
    .duration(200)
    .style("opacity", 1)
    // .style("stroke", "#fff")
    // .style("filter", "none");
  .style("filter", "none")

  d3.select("#annotation")
    .style("opacity", 1)

  tooltip
    .style("opacity", 0)
}

//千分位
function number_format(n) {
  n += "";
  let arr = n.split(".");
  let re = /(\d{1,3})(?=(\d{3})+$)/g;
  return arr[0].replace(re, "$1,") + (arr.length == 2 ? "." + arr[1] : "");
}

