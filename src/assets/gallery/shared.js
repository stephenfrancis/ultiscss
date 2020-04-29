
// const sass = new Sass();

const source_dir = "../";
const assets_dir = "../";
const layout_page = "layout.html";
const widget_page = "widget.html";

const loadFile = (filename, callback) => {
  $.ajax({
    async: false,
    url: filename,
    method: "GET",
    cache: false,
    eror: function (err) {
      alert(`error: ${err} loading: ${filename}`);
    },
    success: function (data) {
      callback(data);
    }
  });
};

const getLoadFilePromise = (filename) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: filename,
      method: "GET",
      cache: false,
      eror: function (err) {
        reject(err);
      },
      success: function (data) {
        resolve(data);
      }
    });
  });
}

// const iframe_base_css_promise = getLoadFilePromise("src/local/iframe.css");

const getComponent = (comp_id) => {
  if (!comp_id) {
    return;
  }
  $("#comp_data").empty();
  const url = assets_dir + comp_id + ".html";
  $("#this_comp").text(comp_id);
  // $(".vis_block iframe").attr("src", url);

  loadFile(url, (data) => {
    var frame = $('iframe');
    var contents = frame.contents();
    var body = contents.find('body');
    body.html(data);
  });

  loadFile(assets_dir + comp_id + ".css", (data) => {
    addStyleToIframes(/* iframe_base_css + */ (data || ""));
  });

  loadFile(assets_dir + comp_id + ".json", (data) => {
    $("#comp_data").text(data);
  });
};

const getLayoutCompFromHash = (hash) => {
  console.log(`starting getLayoutCompFromHash(${hash})`);
  if (hash) {
    getComponent(hash.substr(1));
  }
};

const addStyleToIframes = (style) => {
  var frame = $('iframe');
  var contents = frame.contents();
  // var body = contents.find('body');
  var styleTag = contents.find('head > style:eq(0)');
  styleTag.empty();
  styleTag.append(style);
};

let data_promise = null;
const loadData = () => {
  if (!data_promise) {
    data_promise = getLoadFilePromise(assets_dir + "ultiscss/objects.json")
      .then((data) => {
        const namespaces = {};
        const regex = /([alsw])-([a-z]+)-(.*)/;
        data.forEach((object_id) => {
          const parts = regex.exec(object_id);
          namespaces[parts[2]] = namespaces[parts[2]] || {};
          namespaces[parts[2]][object_id] = {
            id: object_id,
            title: object_id,
            type: parts[1],
          };
        });
        return namespaces;
      });
  }
  return data_promise;
}

const renderLayoutComponents = (selector) => {
  const getLink = (namespace, component_id, component_title) => {
    return "<li><a href='" + layout_page + "#" + namespace + "/" + component_id + "'>" + (component_title || component_id) + "</a></li>";
  }
  loadData()
    .then((namespaces) => {
      console.log(`renderLayoutComponents() namespaces: ${Object.keys(namespaces)}`);
      Object.keys(namespaces).forEach((namespace) => {
        let html = "<div>" + namespace + "<ul>";
        Object.keys(namespaces[namespace]).forEach((object_id) => {
          const object = namespaces[namespace][object_id];
          console.log(`  ${object_id} -> ${JSON.stringify(object)}`);
          if (object.type === "l" && !object.hide_in_gallery) { // layouts
            html += getLink(namespace, object_id, object.title);
          }
        });
        Object.keys(namespaces[namespace]).forEach((object_id) => {
          const object = namespaces[namespace][object_id];
          if (object.type === "a" && !object.hide_in_gallery) { // aggregates
            html += getLink(namespace, object_id, object.title);
          }
        });
        $(selector).append(html);
      });
    });
};

const renderNamespaces = (selector) => {
  loadData()
    .then((namespaces) => {
      let html = "";
      Object.keys(namespaces).forEach((namespace) => {
        html += `<a href="${widget_page}#${namespace}">${namespace}</a>&nbsp;`;
      });
      $(selector).append(html);
    })
};

const addWidget = (comp_id) => {
  const url = assets_dir + comp_id + ".html";
  $("tbody")
    .append("<tr><td>" + comp_id + "</td><td><div><style /><div /></div></td><td></td></tr>");
    // <td class='code defn_markup' /><td class='code defn_scss' />
  var new_row = $("tbody > tr").last();
  console.log(`added new row: ${new_row.length} ${new_row.html()}`);

  loadFile(url, (data) => {
    console.log(`got data ${new_row.find(":eq(1)").length}`);
    // new_row.find("td:eq(1)").text(data);
    new_row.find("td:eq(1) > div > div").html(data);
  });
  // loadFile("../" + comp_id + ".scss", (data) => {
  //   new_row.find("td:eq(2)").text(data);
  // });
  loadFile(assets_dir + comp_id + ".css", (data) => {
    new_row.find("td:eq(1) > div > style").text(data);
  });
  loadFile(assets_dir + comp_id + ".txt", (data) => {
    new_row.find("td:eq(2)").text(data);
  });
}

const addWidgets = (namespace) => {
  $("tbody").empty();
  loadData()
    .then((namespaces) => {
      Object.keys(namespaces[namespace]).forEach((object_id) => {
        const object = namespaces[namespace][object_id];
        if (object.type === "w" && !object.hide_in_gallery) { // widgets
          addWidget(namespace + "/" + object_id);
        }
      });
    });
}

const devices = [
  { w:  320, h:  568, label: "iPhone 5/5SE", },
  { w:  360, h:  640, label: "Galaxy S5", },
  { w:  375, h:  667, label: "iPhone 6/7/8", },
  { w:  375, h:  812, label: "iPhone X", },
  { w:  411, h:  731, label: "Pixel 2", },
  { w:  414, h:  736, label: "iPhone 6/7/8 Plus", },
  { w:  640, h:  360, label: "Galaxy S5 (landscape)", },
  { w:  667, h:  375, label: "iPhone 6/7/8 (landscape)", },
  { w:  731, h:  411, label: "Pixel 2 (landscape)", },
  { w:  768, h: 1024, label: "iPad", },
  { w:  812, h:  375, label: "iPhone X (landscape)", },
  { w:  992, h: 1200, label: "Small Desktop", },
  { w: 1024, h:  768, label: "iPad (landscape)", },
  { w: 1024, h: 1366, label: "iPad Pro", },
  { w: 1200, h: 1200, label: "Large Desktop", },
  { w: 1366, h: 1024, label: "iPad Pro (landscape)", },
];

const setDevice = (index) => {
  const dev = devices[index];
  $(".vis_block").css("width" , String(dev.w + 2) + "px");
  $(".vis_block").css("height", String(dev.h + 2) + "px");
  $(".vis_block h4").text(dev.label);
  $(".vis_block iframe").css("width" , String(dev.w + 2) + "px");
  $(".vis_block iframe").css("height", String(dev.h + 2) + "px");
};

let curr_device = 0;
setDevice(curr_device);

const nextDevice = () => {
  curr_device += 1;
  if (curr_device === devices.length) {
    curr_device = devices.length - 1;
  }
  setDevice(curr_device);
};

const prevDevice = () => {
  curr_device -= 1;
  if (curr_device < 0) {
    curr_device = 0;
  }
  setDevice(curr_device);
};


let cycling = true;
let interval = 1000; // ms
setInterval(() => {
  if (cycling) {
    if (curr_device === (devices.length - 1)) {
      curr_device = 0;
      setDevice(curr_device);
    } else {
      nextDevice();
    }
  }
}, interval);

const toggleCycling = () => {
  cycling = !cycling;
  if (cycling) {
    $("#cycle_toggler").removeClass("btn-outline-secondary");
    $("#cycle_toggler").   addClass("btn-secondary");
  } else {
    $("#cycle_toggler").removeClass("btn-secondary");
    $("#cycle_toggler").   addClass("btn-outline-secondary");
  }
};

