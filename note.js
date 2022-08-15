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


const newArr1 = Object.values(arr.sort((a, b) => {
  return b.a05 - a.a05
}).slice(0, 7)).map((item) => {
  const tempArr1 = [];
  tempArr1.push(item.a03);
  tempArr1.push(item.a05);
  return tempArr1;
});