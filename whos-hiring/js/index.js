//
//@@ Custom app data
//

// map of month to HN link id
var month_id_list = [
  ["October-17", 15384262],
  ["September-17", 15148885],
  ["August-17", 14901313],
  ["July-17", 14688684],
  ["June-17", 14460777],
  ["May-17", 14238005],
  ["April-17", 14023198]
];

// map of states/countries to filter strings for regex search
var region_list = [
  ["All", []],
  ["Remote", ["remote/i"], ["no remote/i"]],
  ["Arkansas", ["Arkansas", "Little Rock"]],
  ["Arizona", ["Arizona", "Phoenix", "PHX", "Scottdale"]],
  ["California", ["California", "San Francisco", "San Diego", 
                 "Los Angeles", "Bay Area", "SF", "LA", "San Mateo",
                 "Mountain View", "Irvine", "Orange County",
                 "Palo Alto", "Menlo Park", "San Jose", "Sunnyvale",
                 "Cupertino", "Santa Clara", "CA", "Redwood"]],
  ["Colorado", ["Colorado", "CO", "Boulder"]],
  ["Florida", ["Florida", "FL", "Orlando", "Miami", "Fort Lauderdale"]],
  ["Idaho", ["Idaho", "ID", "Boise"]],
  ["Illinois", ["Illinois", "Chicago"]],
  ["Kansas", ["Kansas", "KS"]],
  ["Maryland", ["Maryland", "MD", "Baltimore"]],
  ["Massachusetts", ["Massachusetts", "MA", "Boston", "BOS"]],
  ["Michigan", ["Michigan", "MI", "Detroit"]],
  ["Minnesota", ["Minnesota", "Minneapolis", "MSP"]],
  ["New Hampshire", ["New Hampshire", "NH", "Nashua"]],
  ["New York", ["New York", "NY", "NYC", "Buffalo", "Brooklyn"]],
  ["North Carolina", ["North Carolina", "NC", "Charlotte", "Raleigh"]],
  ["Ohio", ["Ohio", "Cleveland", "Columbus"]],
  ["Oregon", ["OR", "Portland", "Oregon"]],
  ["Pennsylvania", ["Pennsylvania", "PA", "Pittsburgh", "Philadelphia"]],
  ["Texas", ["Texas", "TX", "Austin", "Houston", "Dallas"]],
  ["Utah", ["Utah", "Salt Lake City", "SLC"]],
  ["Virginia", ["Virginia", "Richmond", "Reston", "VA"]],
  ["Washington", ["WA", "Seattle", "Bellavue", "Redmond"]],
  ["Washington DC", ["DC"]],

  ["Australia", ["Melbourne", "Sydney", "Brisbane", "Perth", "Australia"]],
  ["Austria", ["Vienna", "Austria"]],
  ["Canada", ["Vancouver", "Canada", "Montreal", "Toronto", "Quebec"]],
  ["Colombia", ["Colombia"]],
  ["Denmark", ["Denmark", "Copenhagen"]],
  ["Estonia", ["Estonia", "Tallinn"]],
  ["France", ["France", "Paris"]],
  ["Germany", ["Germany", "Berlin", "Munich", "Hamburg", "Cologne"]],
  ["Ireland", ["Ireland", "Dublin"]],
  ["Israel", ["Israel", "Tel Aviv"]],
  ["Italy", ["Italy", "Venice", "Florence", "Milan"]],
  ["Netherlands", ["Amsterdam", "Netherlands"]], 
  ["Singapore", ["Singapore"]],
  ["Spain", ["Spain", "Barcelona"]],
  ["Switzerland", ["Switzerland", "Lausanne"]],
  ["Sweden", ["Sweden", "Stockholm"]],
  ["UK", ["London", "UK", "Birmingham", "Manchester", "Glasgow",
         "Newcastle", "Edinburgh"]],
];

//
//@@ App types
//

function Month(id, name) {
  this.id = id;
  this.name = name;
  this.posts = [];
  this.delay_posts = [];
  this.$post_list = makeDomPostList();
  this.loaded = false;
  this.thread_title = "Ask HN: Who is hiring?";
  this.num_posts = 0;
  this.num_posts_loaded = 0;
}

Month.prototype.allPostsLoaded = function() {
  return this.num_posts == this.num_posts_loaded;
}

Month.prototype.show = function() {
  this.$post_list.show();
}

Month.prototype.hide = function() {
  this.$post_list.hide();
}

Month.prototype.appendPost = function(post) {
  this.posts.push(post);
  this.delay_posts.push(post);
  this.num_posts_loaded += 1;
  updateMsg();

  var append_now = false;
  // check if num loaded has reach initial delay size
  if (this.delay_posts.length == app.delay_size &&
      this.num_posts_loaded == this.delay_posts.length) {
    append_now = true;
  // check if num loaded has reach 2nd delay size
  } else if (this.delay_posts.length == app.delay_size2) {
    append_now = true;
  // check if all have been loaded
  } else if (this.num_posts == this.num_posts_loaded) {
    append_now = true;
  }

  if (append_now) {
    var post_list = new Array(this.delay_posts.length);
    filterPosts(this.delay_posts);
    for (var i = 0; i < this.delay_posts.length; i++) {
      post_list[i] = this.delay_posts[i].$post;
    }
    this.delay_posts = [];
    this.$post_list.append(post_list);
  }
};

function Post(id, text, $post) {
  this.id = id;
  this.text = text;
  this.$post = $post;
  this.hidden = false;
}

Post.prototype.hide = function() {
  this.$post.hide();
  this.hidden = true;
}

Post.prototype.show = function() {
  this.$post.show();
  this.hidden = true;
}

//
//@@ Global data init
//

function initApp() {
  var app = {};
  app.$main_header = $("#main_header");
  app.$main_msg = $("#main_msg");
  app.$posts = $("#posts");
  app.$region_select = $("#region_select");
  app.$month_select = $("#month_select");
  app.selected_month = month_id_list[0][0];
  app.selected_region = region_list[0][0];
  app.months = { }; // map<month_name, Month>
  app.regions = { }; // map<region_name, filter_strs>
  app.delay_size = 50; // initial num of posts to append to dom at a time
  app.delay_size2 = 300; // num of posts to append to dom at a time
  app.post_get_num = 20; // num of ajax calls to make at once
  app.post_get_timeout = 200; // num of ms between batched ajax calls

  app.selectedMonth = function() { return this.months[this.selected_month]; }

  for (var i = 0; i < month_id_list.length; i++) {
    var month_name = month_id_list[i][0];
    var id = month_id_list[i][1];
    var month = new Month(id, month_name);
    app.months[month_name] = month;
    month.hide();
    app.$posts.append(month.$post_list);

    var $option = makeDomOption(month_name, month_name);
    app.$month_select.append($option);
  }

  for (var i = 0; i < region_list.length; i++) {
    var region = region_list[i][0];
    var filters = region_list[i][1];
    var negfilters = region_list[i][2] || [];
    app.regions[region] = { filters: filters, negfilters: negfilters };

    var $option = makeDomOption(region, region);
    app.$region_select.append($option);
  }

  return app;
};

var app = initApp();
monthSelect(app.selected_month);

//
//@@ UI update
//

function updateMsg() {
  var month = app.selectedMonth();
  app.$main_header.text(month.thread_title);
  if (month.allPostsLoaded()) {
    app.$main_msg.text("");
  } else {
    var num_loaded = month.num_posts_loaded;
    var num_posts = month.num_posts;
    if (num_posts == 0) {
      num_posts = "?"
    }
    var msg = "Loading... (" + num_loaded + "/" + num_posts + ")";
    app.$main_msg.text(msg); 
  }
}

//
//@@ dom elements constructors
//

function makeDomOption(value, text) {
  return $("<option value=\"" + value + "\">" + text + "</option>");
}

function makeDomPostList() {
  return $("<div class=\"post_list\"></div>");
}

function makeDomPost(id, html) {
  var url = "https://news.ycombinator.com/item?id=" + id; 
  
  var $post = $(
    "<div class='post'>" +
      "<hr>" +
      "<a href='" + url + "' target='_blank'>" + url + "</a>" +
      "<div>" + html + "</div>" +
    "</div>");

  return $post;
}

//
//@@ hacker news api calls
// 

function getItem(id, func) {
  var url = "https://hacker-news.firebaseio.com/v0/item/" + id + 
            ".json?print=pretty";

  jQuery.getJSON(url, func);
}
     
function getPostIDs(month_name) {
  var month = app.months[month_name];
  getItem(month.id, function(data) {
    month.thread_title = data.title;
    month.num_posts = data.kids.length;
    updateMsg();
    var post_ids = data.kids;
    getSomePosts(month, post_ids, app.post_get_num, app.post_get_timeout);
  });
};

function getSomePosts(month, ids, num, timeout) {
  var get_ids = ids.slice(0, num);
  for (var i = 0; i < get_ids.length; i++) {
    getPost(month.name, ids[i]); 
  }
  if (ids.length > num) {
    ids = ids.slice(num);
    setTimeout(function() { 
      getSomePosts(month, ids, num, timeout); 
    }, timeout);
  }
}
 
function getPost(month_name, id) {
  getItem(id, function(post_json) {
    var month = app.months[month_name];
    var $post = makeDomPost(id, post_json.text)
    var post = new Post(id, post_json.text, $post);
    month.appendPost(post);
  });
};

//
//@@ input event handlers
//

// onChange event for #month_select
function monthSelect(month_name) {
  app.selectedMonth().hide();
  app.selected_month = month_name;
  var month = app.selectedMonth();
  month.show();

  if (month.loaded == false) {
    getPostIDs(month.name);
    month.loaded = true;
  } else {
    filterPosts(month.posts);
  }
  updateMsg();
}

// onChange event for #region_select
function regionSelect(region) {
  app.selected_region = region;
  filterPosts(app.selectedMonth().posts);
}

//
//@@ Post filtering by region
//

function filterPosts(posts) {
  filterPostsBy(posts, app.regions[app.selected_region]);
}

function filterPostsBy(posts, filters) {
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    filterPostBy(post, filters);
  }
}

function filterPost(post) {
  filterPostBy(post, app.regions[app.selected_region]);
}

function filterPostBy(post, filters) {
  var filter_strs = filters.filters;
  var negfilter_strs = filters.negfilters;

  if (!post.text) {
    post.hide();
    return;
  }

  if (filter_strs.length == 0) {
    post.show();
    return;
  }

  var show = false;
  for (var i = 0; i < filter_strs.length; i++) {
    var filter = filter_strs[i];
    var ignoreCase = "";
    if (filter.endsWith("/i")) {
      filter = filter.slice(0, -2);
      ignoreCase = "i";
    }
    var re_str = "(\\W|^)+" + filter + "(\\W|$)+";
    var re = new RegExp(re_str, ignoreCase);
    var result = post.text.search(re);
    if (result != -1) {
      show = true;
      break;
    }
  }

  if (show) {
    for (var i = 0; i < negfilter_strs.length; i++) {
      var filter = negfilter_strs[i];
      var ignoreCase = "";
      if (filter.endsWith("/i")) {
        filter = filter.slice(0, -2);
        ignoreCase = "i";
      }
      var re_str = "(\\W|^)+" + filter + "(\\W|$)+";
      var re = new RegExp(re_str, ignoreCase);
      var result = post.text.search(re);
      if (result != -1) {
        show = false;
        break;
      }
    }
  }

  if (show) {
    post.show();
  } else {
    post.hide();
  }
}

