var log = function(value) {
    if (value instanceof Array) {
        console.log('is an array');
    }
    console.log(value)
    return value
}

function sorts(list) {
    return {
        onclick: function(e) {
            var prop = e.target.getAttribute("data-sort-by")
            if (prop) {
                var first = list[0]
                list.sort(function(a, b) {
                    if (a instanceof Host || b instanceof Host) {
                        return a.d[prop]() > b.d[prop]() ? 1 : a.d[prop]() < b.d[prop]() ? -1 : 0
                    }
                    return a[prop]() > b[prop]() ? 1 : a[prop]() < b[prop]() ? -1 : 0
                })
                if (first === list[0]) list.reverse()
            }
        }
    }
}


var Group = function(data) {
    this.d = {};
    var d = this.d;

    d.id = data ? m.prop(data["@id"]) : m.prop("");
    d.name = data ? m.prop(data.name) : m.prop("");
    d.enabled = data ? m.prop(data.enabled) : m.prop("");
    d.variables = data ? m.prop(data.variables) : m.prop([]);
    if (d.variables == {}) {
        d.variables([]);
    }
    d.hosts_arr = data ? m.prop(data.hosts) : m.prop([]);
    d.hosts = function(){
        return Hosts.list().filter(function(el){
            return d.hosts_arr().indexOf(el.d.id());
        });
    }
}

Group.prototype.toJSON = function() {
    var d = this.d;
    var obj = {
        "@id": d.id(),
        "name": d.name(),
        "enabled": d.enabled(),
        "variables": d.variables(),
        "hosts": d.hosts()
    };
    console.log(obj);

    Object.keys(obj).map(function(property, index) {
        if (obj[property] === undefined || obj[property] == "") {
            delete obj[property];
        }
    });

    console.log(obj);

    return obj;
};

var Groups = function() {};
Groups.list = m.prop([]);
Groups.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
}

Groups.storage = mx.storage('Groups', mx.LOCAL_STORAGE);
Groups.store = function(value, add = false) {
    if (value instanceof Array) {
        if (!add) {
            Groups.list(Groups.list().concat(value));
        }
        Groups.storage.set('groupsList', Groups.list());
        return Groups.list();
    }
    if (!value && localStorage.getItem('groupsList') !== null) {
        console.log('Fetching from localStorage');
        Groups.storage.get('groupsList').forEach(function(element){
            Groups.list().push(new Group(element));
        });

        return true;
    }
}

Groups.getList = function(direction=false) {
    var base = "http://127.0.0.1:8000";
    var end = "/groups";

    if (Groups.api.total !== undefined && Groups.list().length == Groups.api.total) {
        return;
    }

    if (!direction) {
        if (Groups.store()) {
            m.redraw();
            return;
        }
    }

    url = base+end;
    if (direction == "next") {
        if (!Groups.api.next) {
            return;
        }
        url = base+Groups.api.next;
    }
    if (direction == "previous") {
        if (!Groups.api.previous) {
            return;
        }
        url = base+Groups.api.previous;
    }
    if (direction == "last") {
        url = base+Groups.api.last;
    }
    console.log(url);

    console.log(Groups.api.total);
    console.log(Groups.list().length);
    m.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function(response) {
            Groups.api.initial = false;
            Groups.api.next = response["hydra:nextPage"] || false;
            Groups.api.previous = response["hydra:previousPage"] || false;
            Groups.api.last = response["hydra:lastPage"];
            Groups.api.first = response["hydra:firstPage"];
            Groups.api.total = response["hydra:totalItems"];
            console.log(Groups.api.total);
            console.log(Groups.list().length);
            return response["hydra:member"];
        },
        type: Group
    }).then(log)
    .then(Groups.store)
    .then(m.redraw)
    .then(function(data){
        // while debugging other stuff disable this
        Groups.getList('next');
    });
}

Groups.vm = (function() {
    var vm = {}
    vm.init = function() {
        Groups.getList();
        vm.list = Groups.list;
    }

    return vm
}())

Groups.controller = function() {
    Groups.vm.init();
}

Groups.view = function() {
    return m("div[class=panel panel-default]", [
            m("div[class=panel-heading]", [
                m("h3[class=panel-title", "Available Groups"),
            ]),
            m("div[class=panel-body]", [
            //    m("button[class=btn btn-default]", {onclick: m.withAttr("data-id", function(value){
            //                    Hosts.vm.createHost();
            //                })}, "New Host"),
            ]),

            m("table[class=table table-condensed table-striped table-hover]", sorts(Groups.list()), [
                m("thead", [
                    m("tr", [
                        m("th[data-sort-by=name]", {}, 'Name'),
                    ])
                ]),
                m("tbody", [
                Groups.vm.list().map(function(group, index, array) {
                    return m("tr[data-id="+group.d.id()+"]", {
                            class: (group == Groups.vm.group) ? 'success' : '',
                            onclick: m.withAttr("data-id", function(value){
                                Groups.vm.edit(group);
                            })
                        }, [
                        m("td", {}, group.d.name()),
                    ])
                })
          ])
        ])
    ]);
};

var Host = function(data) {
    this.d = {};
    var d = this.d;
    d.id = data ? m.prop(data["@id"]) : m.prop("");
    d.created = data ? m.prop(data.created) : m.prop("");
    d.domain = data ? m.prop(data.domain) : m.prop("");
    d.enabled = data ? m.prop(data.enabled) : m.prop("");
    d.host = data ? m.prop(data.host) : m.prop("");
    d.hostname = data ? m.prop(data.hostname) : m.prop("");
    d.updated = data ? m.prop(data.updated) : m.prop("");
    d.ip = data ? m.prop(data.ip) : m.prop("");
    d.groups_arr = data ? m.prop(data.groups || []) : m.prop([]);
    d.groups = function(){
        return Groups.list().filter(function(el){
            return d.groups_arr().indexOf(el.d.id());
        });
    }
    d.variables = data ? m.prop(data.variables) : m.prop({});
    if (d.variables == {}) {
        d.variables([]);
    }

    this.editable = [
        'domain',
        'enabled',
        'host',
        'hostname',
        'ip',
        'groups_arr',
        'variables'
    ];

    this.state = {};
    var state = this.state;
    state.visible = m.prop(true);
};

Host.prototype.toJSON = function() {
    var d = this.d;
    var obj = {
        "@id": d.id(),
        "created": d.created(),
        "domain": d.domain(),
        "enabled": d.enabled(),
        "host": d.host(),
        "hostname": d.hostname(),
        "updated": d.updated(),
        "ip": d.ip(),
        "groups": d.groups_arr(),
        "variables": d.variables()
    };

    Object.keys(obj).map(function(property, index) {
        if (obj[property] === undefined || obj[property] === "") {
            if (typeof(property) !== "boolean") {
                delete obj[property];
            }
        }
    });

    return obj;
};

Host.update = function(host) {
    if (!(host instanceof Host)) {
        console.log('Argument needs to be of type Host.', host);
        return;
    }
    console.log(host);

    var base = "http://127.0.0.1:8000";
    url = base + host.d.id();
    m.request({
        method: "PUT",
        url: url,
        data: host,
        type: Host
    }).then(log)
    .then(Hosts.replace);
}

Host.post = function(host) {
    if (!(host instanceof Host)) {
        console.log('Argument needs to be of type Host.', host);
        return;
    }
    console.log(host);

    var base = "http://127.0.0.1:8000";
    var endpoint = "/hosts"
    url = base + endpoint;
    m.request({
        method: "POST",
        url: url,
        data: host,
        type: Host
    }).then(log)
    .then(Hosts.add);
}

Host.host = new Host();

Host.vm = (function() {
    var vm = {}
    vm.init = function() {
        vm.host = Host.host;
    }

    vm.groups = Groups.list();

    vm.edit = function(host, open = false) {
        vm.host = host;
        if (open) {
            Host.vm.openModal();
        }
    }

    vm.openModal = function(size) {
        vm.modalInstance = m.u.init(m.ui.modal({
            size: size,
            params: {
                host: vm.host
            },
            module: HostModal,
            onopen: function(modalCtrl){
                // redraw first else it didn't finish rendering the view yet
                m.redraw();
                vm.initJsonEditor();
                vm.initGroupSelect();
            }
        }));

        vm.modalInstance.result.then(function() {
            Host.vm.save(Host.vm.host);
        }, function() {
            console.log('Modal dismissed');
        });
    };

    vm.create = function() {
        vm.edit(new Host(), true);
    }

    vm.save = function(host) {
        if (jseditor.editor != undefined) {
            host.d.variables(jseditor.editor.get());
        }

        if (host.d.id()) {
            vm.update(host);
        } else {
            vm.post(host);
        }
    }

    vm.update = function(data) {
        Host.update(data);
    }

    vm.post = function(data) {
        Host.post(data);
    }

    vm.inGroup = function(group) {
        if (vm.host.d.groups_arr().indexOf(group.d.id()) >= 0) {
            return true;
        }

        return false;
    }

    vm.modGroup = function(value) {
        console.log(value);
        if (vm.host.d.groups_arr().indexOf(value) === -1) {
            console.log('adding group', value);
            vm.host.d.groups_arr().push(value);
        } else {
            console.log('removing group', value);
            vm.host.d.groups_arr(vm.host.d.groups_arr().filter(function (el) {
                return el !== value;
            }));
        }
    }

    var jseditor = {}
    vm.initJsonEditor = function() {
        if (jseditor.editor != undefined) {
            jseditor.editor.destroy();
        }
        m.startComputation();
        jseditor.editorContainer = document.getElementById("hostEditorvariables");
        jseditor.editorOptions = {};
        jseditor.editor = new JSONEditor(jseditor.editorContainer, jseditor.editorOptions);

        if (vm.host.d.variables() == undefined) {
            vm.host.d.variables({});
        }
        jseditor.editor.set(vm.host.d.variables());
        m.endComputation();
        m.redraw();
    }

    vm.initGroupSelect = function() {
        var el = $("#groupSelect");
        if (el.hasClass("select2-hidden-accessible")) {
            // redraw to reflect the change, else it can sometimes show the old one
            el.select2("destroy");
            m.redraw();
        }
        el.select2();
        el.on("change", function(e) {
            m.startComputation();
            var groups = el.select2("val");

            // simply set the returned array as the new group list
            Host.vm.host.d.groups_arr(groups);

            m.endComputation();
            m.redraw();
        });
    }

    vm.enableButton = function(host) {
        if (host.d.enabled()) {
            return m('button', {
                class:"btn btn-default btn-xs",
                onclick: function() {host.d.enabled(false); vm.save(host)},
            }, [
                m("span", {class:"glyphicon glyphicon-pause"})
            ]);

        } else {
            return m('button', {
                class:"btn btn-default btn-xs",
                onclick: function() {host.d.enabled(true); vm.save(host)},
            }, [
                m("span", {class:"glyphicon glyphicon-play"})
            ]);
        }
    }

    return vm
}())

Host.controller = function() {
    Host.vm.init();
}

var HostModal = {};

HostModal.vm = (function() {
    var vm = {};

    return vm;
}())

HostModal.controller = function(params) {
  var ctrl = this;
  var vm = HostModal.vm;

  ctrl.host = params.host;

  ctrl.ok = function() {
    ctrl.$modal.close();
  };

  ctrl.cancel = function() {
    ctrl.$modal.dismiss('Cancel');
  };
}

HostModal.view = function(ctrl) {
    return m("div", [
            m("div", {class: "modal-header"}, [
                m("h3", {class: "modal-title"}, ["Edit Host"]),
                ]),
            m("div", {class: "modal-body"}, [
                m("div", {class: "panel panel-info"}, [
                    m("div", {class:"panel-heading"}, [
                        m("h3", {class:"panel-title"}, "Information"),
                    ]),
                    m("div", {class: "panel-body"}, [
                        m("div", {class:"checkbox"}, [
                            m("label[for=enabled]", [
                                m("input[id=enabled],[type=checkbox]", {onchange: m.withAttr("checked", Host.vm.host.d.enabled), checked: Host.vm.host.d.enabled()}),
                            ], "Enabled"),
                        ]),
                        m("div", {class:"form-group"}, [
                            m("label[for=ip]", "IP"),
                            m("input[id=ip],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.ip), value: Host.vm.host.d.ip()}),
                        ]),
                        m("div", {class:"form-group"}, [
                            m("label[for=hostname]", "Hostname"),
                            m("input[id=hostname],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.hostname), value: Host.vm.host.d.hostname()}),
                        ]),
                        m("div", {class:"form-group"}, [
                            m("label[for=host]", "Host"),
                            m("input[id=host],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.host), value: Host.vm.host.d.host()}),
                        ]),
                        m("div", {class:"form-group"}, [
                            m("label[for=domain]", "Domain"),
                            m("input[id=domain],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.domain), value: Host.vm.host.d.domain()}),
                        ]),
                    ])
                ]),

                m("div", {class: "panel panel-info"}, [
                    m("div", {class:"panel-heading"}, [
                        m("h3", {class:"panel-title"}, "Variables"),
                    ]),
                    m("div", [
                        m("div[id=hostEditorvariables]", {style: {height: "400px"}}),
                    ]),
                ]),

                m("div", {class: "panel panel-info"}, [
                    m("div", {class:"panel-heading"}, [
                        m("h3", {class:"panel-title"}, "Groups"),
                    ]),
                    m("div", [
                        m("select[id=groupSelect]", {multiple: 'multiple'}, [ //, size: Host.vm.groups.length}, [
                            Host.vm.groups.map(function(group, index) {
                                return m("option", {value: group.d.id(), selected: Host.vm.inGroup(group)}, group.d.name())
                            })
                            ])
                        ]),
                ]),

                m("div", {class:"modal-footer"}, [
                    m("button", {class:"btn btn-default",
                        onclick:  function(value){
                            ctrl.cancel();
                        }}, "Cancel"
                    ),
                    m("button[class=btn btn-primary]",
                        {onclick:  function(value){
                            ctrl.ok();
                        }}, "Save"
                    ),
                ]),
            ]),
        ]);
};

var Hosts = function(){};
Hosts.list = m.prop([]);
Hosts.picked = m.prop([]);
Hosts.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
}

Hosts.replace = function(host) {
    var index = Hosts.list().map(function(el){
        return el.d.id();
    }).indexOf(host.d.id());


    Hosts.list().splice(index, 1, host);

    Hosts.store([], true);
    m.redraw();

    return host;
}

Hosts.add = function(host) {
    var found = Hosts.list().some(function (el) {
        return el.d.id() == host.d.id();
    });
    if (!found) {
        Hosts.list().push(host);
        Hosts.store([], true);
    }
    m.redraw();

    return host;
}

Hosts.pick = function(host) {
    var found = Hosts.picked().some(function (el) {
        return el.d.id() == host.d.id();
    });
    if (!found) {
        // add to picked
        Hosts.picked().push(host);
    } else {
        // remove from picked
        Hosts.picked(Hosts.picked().filter(function (el) {
            return el !== host;
        }));
    }
}

Hosts.isPicked = function(host) {
    return Hosts.picked().some(function (el) {
        return el.d.id() == host.d.id();
    });
}

Hosts.storage = mx.storage('Hosts', mx.LOCAL_STORAGE);
Hosts.store = function(value, add = false) {
    if (value instanceof Array) {
        if (!add) {
            Hosts.list(Hosts.list().concat(value));
        }
        Hosts.storage.set('hostsList', Hosts.list());
        return Hosts.list();
    }
    if (!value && localStorage.getItem('hostsList') !== null) {
        console.log('Fetching from localStorage');
        Hosts.storage.get('hostsList').forEach(function(element){
            Hosts.list().push(new Host(element));
        });

        return true;
    }
}

Hosts.getList = function(direction=false) {
    var base = "http://127.0.0.1:8000";
    var end = "/hosts";

    if (Hosts.api.total !== undefined && Hosts.list().length == Hosts.api.total) {
        return;
    }

    if (!direction) {
        if (Hosts.store()) {
            m.redraw();
            return;
        }
    }

    url = base+end;
    if (direction == "next") {
        if (!Hosts.api.next) {
            return;
        }
        url = base+Hosts.api.next;
    }
    if (direction == "previous") {
        if (!Hosts.api.previous) {
            return;
        }
        url = base+Hosts.api.previous;
    }
    if (direction == "last") {
        url = base+Hosts.api.last;
    }
    console.log(url);

    console.log(Hosts.api.total);
    console.log(Hosts.list().length);
    m.request({
        method: "GET",
        url: url,
        background: true,
        initialValue: [],
        unwrapSuccess: function(response) {
            Hosts.api.initial = false;
            Hosts.api.next = response["hydra:nextPage"] || false;
            Hosts.api.previous = response["hydra:previousPage"] || false;
            Hosts.api.last = response["hydra:lastPage"];
            Hosts.api.first = response["hydra:firstPage"];
            Hosts.api.total = response["hydra:totalItems"];
            console.log(Hosts.api.total);
            console.log(Hosts.list().length);
            return response["hydra:member"];
        },
        type: Host
    }).then(log)
    .then(Hosts.store)
    .then(m.redraw)
    .then(function(data){
        // while debugging other stuff disable this
        Hosts.getList('next');
    });
}

Hosts.vm = (function() {
    var vm = {}
    vm.init = function() {
        Hosts.getList();
        //vm.list = Hosts.list;
    }

    vm.listFilter = m.prop("");

    vm.list = function(){
        if (vm.listFilter() == "") {
            return Hosts.list();
        }
        return Hosts.list().filter(function(host, i){
            var searchable = ['ip', 'domain', 'host', 'hostname', 'created', 'updated'];
            var found = false;

            searchable.forEach(function(prop){
                if (typeof(host.d[prop]()) === "string") {
                    if (host.d[prop]().toUpperCase().includes(vm.listFilter().toUpperCase())) {
                        found = true;
                    }
                }
            });

            return found;
        })
    };

    vm.picked = function() {
        var toggle = vm.pickButtons();
        if (toggle != 'manual') {
            if (toggle == 'none') {
                Hosts.picked([]);
            }
            if (toggle == 'all') {
                Hosts.picked(Hosts.list());
            }
            if (toggle == 'inverse') {
                var newlist = Hosts.list();
                Hosts.picked().forEach(function(host) {
                    newlist = newlist.filter(function (el) {
                        return el !== host;
                    });
                });
                Hosts.picked(newlist);
            }
            vm.pickButtons('manual');
        }
        return Hosts.picked();
    }

    vm.next = function() {
        Hosts.getList("next");
    }
    vm.previous = function() {
        Hosts.getList("previous");
    }
    vm.last = function() {
        Hosts.getList("last");
    }
    vm.first = function() {
        Hosts.getList("first");
    }

    vm.createHost = function() {
        Host.vm.create();
    }

    vm.edit = function(host) {
        Host.vm.edit(host, true);
    }

    vm.pick = function(host) {
        vm.pickButtons('manual');
        Hosts.pick(host);
    }

    vm.isPicked = function(host) {
        return Hosts.isPicked(host);
    }

    vm.update = function(data) {
        Host.vm.update(data);
    }

    vm.pager = {};
    // pagination needed things
    //var pagination = m.prop({});
    vm.pager.totalItems = function() {
        return vm.list() ? vm.list().length : 0;
    }.bind(vm.pager);

    vm.pager.currentPage = m.prop(0);
    vm.pager.itemsPerPage = m.prop(25);
    vm.pager.maxSize = 7;
    vm.pager.directionLinks = true;
    vm.pager.boundaryLinks = true;
    vm.pager.previousText = '<';
    vm.pager.nextText = '>';
    vm.pager.pagination = m.u.init(m.ui.pagination(vm.pager));

    vm.pickButtons = m.prop('manual');


    vm.columns = (function(){
        var columns = {};
        columns.ip = m.prop(true);
        columns.domain = m.prop(true);
        columns.host = m.prop(true);
        columns.hostname = m.prop(true);
        columns.created = m.prop(true);
        columns.updated = m.prop(true);

        return columns;
    })();

    vm.showAllColumns = function() {
        Object.keys(Hosts.vm.columns).forEach(function(column){
            vm.columns[column](true);
        })
        m.redraw();
    }

    return vm
}())

Hosts.controller = function() {
    var vm = Hosts.vm;
    vm.init();
}

Hosts.view = function(ctrl) {
    return m("div", {class:"panel panel-default"}, [
            m("div", {class:"panel-heading"}, [
                m("h3", {class:"panel-title"}, "Available Hosts"),
            ]),
            m("div", {class:"panel-body"}, [
                m("button", {class:"btn btn-default", onclick: m.withAttr("data-id", function(value){
                                Hosts.vm.createHost();
                            })}, "New Host"),
                m("div", [Hosts.vm.pager.pagination.$view()]),

                m("div", {
                    class: "btn-group"
                    }, [
                    m("button", {
                      class: "btn btn-default",
                      config: m.ui.configRadio(Hosts.vm.pickButtons, 'none')
                    }, ["None"]),
                    m("button", {
                      class: "btn btn-default",
                      config: m.ui.configRadio(Hosts.vm.pickButtons, 'inverse')
                    }, ["Inverse"]),
                    m("button", {
                      class: "btn btn-default",
                      config: m.ui.configRadio(Hosts.vm.pickButtons, 'all')
                    }, ["All"])
                ]),

                m("div", {
                  class: "btn-group",
                  config: m.ui.configDropdown()
                }, [
                  m("button", {
                    type: "button",
                    class: "btn btn-default dropdown-toggle"
                  }, [
                    m("span", {class:"glyphicon glyphicon-cog"}),
                    m("span", {class: "caret"}),
                  ]),
                  m("ul", {
                    class: "dropdown-menu",
                    role: "menu"
                  }, [
                    m("li", [
                        m("a", {
                            onclick: Hosts.vm.showAllColumns,
                        }, ["Show all Columns"]),
                    ]),
                    (function(){
                        var cols = [];
                        Object.keys(Hosts.vm.columns).forEach(function(column){
                            cols.push(
                                m("li", [m("a", [
                                    m("label[for=colShow"+column+"]", [
                                        m("input[id=colShow"+column+"],[type=checkbox]", {onchange: m.withAttr("checked", Hosts.vm.columns[column]), checked: Hosts.vm.columns[column]()}),
                                    ], column)
                                ])
                                ])
                            );
                        });

                        return cols;
                    })(),
                    m("li", {
                        class: "divider"
                    }),
                    m("li", [
                        m("label[for=itemsPerPage]", "Items per Page"),
                        m("input[id=itemsPerPage],[type=number],[step=10]", {onchange: m.withAttr("value", Hosts.vm.pager.itemsPerPage), value: Hosts.vm.pager.itemsPerPage()}),
                    ]),
                  ])
                ]),
            ]),
            m("div", {}, "Hosts selected: ", Hosts.vm.picked().length),
            m("label[for=listFilter]", "Search"),
            m("input[id=listFilter]", {onchange: m.withAttr("value", Hosts.vm.listFilter), value: Hosts.vm.listFilter()}),


            m("table[class=table table-condensed table-striped table-hover]", sorts(Hosts.list()), [
                m("thead", [
                    m("tr", [
                        m("th[data-sort-by=state-picked]", {}, 'Pick'),
                        m("th", {}, 'Options'),
                        (function(){
                            var header = [];
                            header.push(Hosts.vm.columns.ip() ? m("th[data-sort-by=ip]", {}, 'IP') : undefined);
                            header.push(Hosts.vm.columns.domain() ? m("th[data-sort-by=domain]", {}, 'Domain') : undefined);
                            header.push(Hosts.vm.columns.host() ? m("th[data-sort-by=host]", {}, 'Host') : undefined);
                            header.push(Hosts.vm.columns.hostname() ? m("th[data-sort-by=hostname]", {}, 'Hostname') : undefined);
                            header.push(Hosts.vm.columns.created() ? m("th[data-sort-by=created]", {}, 'Created') : undefined);
                            header.push(Hosts.vm.columns.updated() ? m("th[data-sort-by=updated]", {}, 'Updated') : undefined);

                            return header;
                        })(),
                    ])
                ]),
                m("tbody", [
                Hosts.vm.list()
                .slice(
                    Hosts.vm.pager.itemsPerPage() * Hosts.vm.pager.currentPage(),
                    Hosts.vm.pager.itemsPerPage() * (Hosts.vm.pager.currentPage() + 1))
                .map(function(host, i) {
                    return m("tr", {}, [
                        m("td", {}, m("input[type=checkbox]", {
                            onclick: function(e) {
                                Hosts.vm.pick(host)
                                e.stopImmediatePropagation();
                            },
                            checked: Hosts.vm.isPicked(host)})
                            ),
                        m("td", {}, [
                            m("button", {
                                onclick: function(e) {
                                    Host.vm.edit(host, true);
                                },
                                class: "btn btn-default btn-xs"
                            }, [
                                m("span", {class: "glyphicon glyphicon-pencil"})
                            ]),
                            Host.vm.enableButton(host),
                        ]),
                        (function(){
                            var body = [];
                            body.push(Hosts.vm.columns.ip() ? m("td", {}, host.d.ip()) : undefined);
                            body.push(Hosts.vm.columns.domain() ? m("td", {}, host.d.domain()) : undefined);
                            body.push(Hosts.vm.columns.host() ? m("td", {}, host.d.host()) : undefined);
                            body.push(Hosts.vm.columns.hostname() ? m("td", {}, host.d.hostname()) : undefined);
                            body.push(Hosts.vm.columns.created() ? m("td", {}, dateFormat(Date.parse(host.d.created()))) : undefined);
                            body.push(Hosts.vm.columns.updated() ? m("td", {}, dateFormat(Date.parse(host.d.updated()))) : undefined);

                            return body;
                        })(),
                    ])
                })
          ])
        ])
    ]);
};

var ansible = {};

ansible.controller = function() {
    var ctrl = this;

    ctrl.list = new Hosts.controller();
    //ctrl.host = new Host.controller();
    ctrl.groupList = new Groups.controller();
}

ansible.view = function(ctrl) {
    return [
    m("nav", {class:"navbar navbar-default navbar-fixed-top"}, [
        m("div", {class: "container-fluid"}, [
            m("div", {id:"navbar"}, [
                m("ul", {class:"nav navbar-nav"}, [
                    m("li", {}, [
                        m("a", {}, ["Hosts"]),
                    ]),
                    m("li", {}, [
                        m("a", {}, ["Groups"]),
                    ]),
                ]),
            ]),
        ]),
    ]),
    m("div", {class:"container-fluid"}, [
        m("div", {class:"row-fluid"}, [
            m("div", {class:"col-md-12"}, [
                Hosts.view(ctrl.list)
            ])
        ])
    ]),
    m("div", [
      Host.vm.modalInstance ? Host.vm.modalInstance.$view() : []
    ])
    ];
}

m.module(document.body, ansible);
//initialize the application
//m.mount(document.body, {controller: Hosts.controller, view: Hosts.view});
//m.mount(document.body, [
//    {controller: Hosts.controller, view: Hosts.view},
////    {controller: Host.controller, view: Host.view}
//]);
