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

    //vm.createGroup = function() {
    //    Host.vm.create();
    //}

    //vm.select = function(host) {
    //    Host.vm.select(host);
    //}

    //vm.update = function(data) {
    //    Host.vm.update(data);
    //}
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
                                Groups.vm.select(group);
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

    this.editable = [
        'domain',
        'enabled',
        'host',
        'hostname',
        'ip',
        'groups_arr',
        'variables'
    ];
    this.state = {
        visible: m.prop(true)
    };
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
    console.log(obj);

    Object.keys(obj).map(function(property, index) {
        if (obj[property] === undefined || obj[property] == "") {
            delete obj[property];
        }
    });

    console.log(obj);

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
    var jseditor = {}
    vm.init = function() {
        vm.host = Host.host;
    }

    vm.select = function(host) {
        vm.host = host;
        if (jseditor.editor != undefined) {
            jseditor.editor.destroy();
        }
        jseditor.editorContainer = document.getElementById("hostEditorvariables");
        jseditor.editorOptions = {};
        jseditor.editor = new JSONEditor(jseditor.editorContainer, jseditor.editorOptions);

        console.log(vm.host.d.variables());
        if (vm.host.d.variables() == undefined) {
            vm.host.d.variables({});
        }
        jseditor.editor.set(vm.host.d.variables());
        m.redraw();
    }

    vm.create = function() {
        vm.select(new Host());
    }

    vm.save = function(host) {
        host.d.variables(jseditor.editor.get());

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
        if (vm.host.d.groups_arr().indexOf(group.d.id()) > 0) {
            return true;
        }

        return false;
    }

    vm.modGroup = function(value) {
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

    return vm
}())

Host.controller = function() {
    Host.vm.init();
}

Host.view = function() {
    return m("div", [
            m("div[class=panel panel-primary]", [
                m("div[class=panel-heading]", [
                    m("h3[class=panel-title]", "Edit Host"),
                    ]),
                m("div[class=panel-body]", [
                    m("div[class=checkbox]", [
                        m("label[for=enabled]", [
                            m("input[id=enabled],[type=checkbox]", {onchange: m.withAttr("value", Host.vm.host.d.enabled), value: Host.vm.host.d.enabled()}),
                            ], "Enabled"),
                        ]),
                    m("div[class=form-group]", [
                        m("label[for=ip]", "IP"),
                        m("input[id=ip],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.ip), value: Host.vm.host.d.ip()}),
                        ]),
                    m("div[class=form-group]", [
                        m("label[for=hostname]", "Hostname"),
                        m("input[id=hostname],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.hostname), value: Host.vm.host.d.hostname()}),
                        ]),
                    m("div[class=form-group]", [
                        m("label[for=host]", "Host"),
                        m("input[id=host],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.host), value: Host.vm.host.d.host()}),
                        ]),
                    m("div[class=form-group]", [
                        m("label[for=domain]", "Domain"),
                        m("input[id=domain],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d.domain), value: Host.vm.host.d.domain()}),
                        ]),
                    m("div[class=form-group]", [
                        m("label[for=hostEditorvariables]", "Variables"),
                        m("div[id=hostEditorvariables]", {style: {height: "400px"}}),
                        ]),

              m("div[class=panel panel-info]", [
                m("div[class=panel-heading]", [
                    m("h3[class=panel-title]", "Groups"),
                ]),
                m("div", {class: "panel-body", style: {maxHeight: "200px", overflowY: "scroll"}}, [
                    Groups.list().map(function(group, index) {
                        return m("div[class=checkbox]", [
                            m("label", {for: group.d.name()}, [
                                m("input[id=enabled],[type=checkbox]", {onchange: m.withAttr("value", Host.vm.modGroup), value: group.d.id(), checked: Host.vm.inGroup(group) }),
                                ], group.d.name()),
                            ]);
                    })
                    ]),

              //Object.keys(Host.vm.host.d).map(function(property, index) {
              //    if (Host.vm.host.editable.indexOf(property) >= 0) {
              //        return m("div[class=form-group]", [
              //            m("label[for="+property+"]", property),
              //            m("input[id="+property+"],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d[property]), value: Host.vm.host.d[property]()}),
              //        ]);
              //    }
              //}),
                    ]),
              m("button[class=btn btn-default]", {onclick:  function(value){
                  //Host.vm.host = host;
                  Host.vm.save(Host.vm.host);
              }}, "Save"),
              ]),
              ]),
                ]);
};

Host.view_old = function() {
    return m("div[class=panel panel-default]", [
            m("div[class=panel-heading]", [
                m("h3[class=panel-title", "Edit Host"),
            ]),
            m("div[class=panel-body]", [
            Object.keys(Host.vm.host.d).map(function(property, index) {
                if (Host.vm.host.editable.indexOf(property) >= 0) {
                    return m("div[class=form-group]", [
                        m("label[for="+property+"]", property),
                        m("input[id="+property+"],[class=form-control]", {onchange: m.withAttr("value", Host.vm.host.d[property]), value: Host.vm.host.d[property]()}),
                    ]);
                }
            }),
            m("button[class=btn btn-default]", {onclick:  function(value){
                            //Host.vm.host = host;
                            if (Host.vm.host.d.id()) {
                                Host.vm.update(Host.vm.host);
                            } else {
                                Host.vm.post(Host.vm.host);
                            }
                        }}, "Save"),
        ]),
    ]);
};


var Hosts = function(){};
Hosts.list = m.prop([]);
Hosts.api = {
    first: false,
    next: false,
    previous: false,
    last: false,
    total: undefined,
    initial: true
}

Hosts.replace = function(host) {
    console.log('replacing', host);
    Hosts.list(Hosts.list().filter(function (el) {
        return el.d.id() !== host.d.id();
    }));
    Hosts.list().push(host);
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
        vm.list = Hosts.list;
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

    vm.select = function(host) {
        Host.vm.select(host);
    }

    vm.update = function(data) {
        Host.vm.update(data);
    }
    return vm
}())

Hosts.controller = function() {
    Hosts.vm.init();
}

Hosts.view = function() {
    return m("div[class=panel panel-default]", [
            m("div[class=panel-heading]", [
                m("h3[class=panel-title", "Available Hosts"),
            ]),
            m("div[class=panel-body]", [
                m("button[class=btn btn-default]", {onclick: m.withAttr("data-id", function(value){
                                Hosts.vm.createHost();
                            })}, "New Host"),
            ]),

            m("table[class=table table-condensed table-striped table-hover]", sorts(Hosts.list()), [
                m("thead", [
                    m("tr", [
                        m("th[data-sort-by=ip]", {}, 'IP'),
                        m("th[data-sort-by=domain]", {}, 'Domain'),
                        m("th[data-sort-by=host]", {}, 'Host'),
                        m("th[data-sort-by=hostname]", {}, 'Hostname'),
                        m("th[data-sort-by=created]", {}, 'Created'),
                        m("th[data-sort-by=updated]", {}, 'Updated'),
                    ])
                ]),
                m("tbody", [
                Hosts.vm.list().map(function(host, index, array) {
                    return m("tr[data-id="+host.d.ip()+"]", {
                            class: (host == Host.vm.host) ? 'success' : '',
                            onclick: m.withAttr("data-id", function(value){
                                Hosts.vm.select(host);
                            })
                        }, [
                        m("td", {}, host.d.ip()),
                        m("td", {}, host.d.domain()),
                        m("td", {}, host.d.host()),
                        //m("td", [m("input", {onchange: m.withAttr("value", function(value){
                        //    host.host(value);
                        //    Hosts.vm.update(host);
                        //}), value: host.host()})]),
                        m("td", {}, host.d.hostname()),
                        m("td", {}, host.d.created()),
                        m("td", {}, host.d.updated()),
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
    ctrl.host = new Host.controller();
    ctrl.groupList = new Groups.controller();
}

ansible.view = function(ctrl) {
    return m("div[class=container-fluid]", [
        m(".row-fluid", [
        //m(".col-md-3", [ Host.vm.host.d.ip() ? Host.view(ctrl.host) : '' ]),
        m(".col-md-3", [ Host.view(ctrl.host) ]),
        //m(".col-md-3", [ Groups.view(ctrl.groupList) ]),
        m(".col-md-9", [
            Hosts.view(ctrl.list)
        ])
        ])
    ]);
}

m.module(document.body, ansible);
//initialize the application
//m.mount(document.body, {controller: Hosts.controller, view: Hosts.view});
//m.mount(document.body, [
//    {controller: Hosts.controller, view: Hosts.view},
////    {controller: Host.controller, view: Host.view}
//]);
