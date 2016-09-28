var Host = function (data) {
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
    d.groupsArr = data ? m.prop(data.groups || []) : m.prop([]);
    d.groups = function () {
        return Groups.list().filter(function (el) {
            return d.groupsArr().indexOf(el.d.id());
        });
    };
    d.variables = data ? m.prop(data.variables) : m.prop({});
    if (d.variables === {}) {
        d.variables([]);
    }
    this.columns = [
        {"name":"ID",
            "editable": false,
            "object":"id",
            "type":"integer"},
        {"name":"Created",
            "editable": false,
            "object":"created",
            "type":"datetime"},
        {"name":"Updated",
            "editable": false,
            "object":"updated",
            "type":"datetime"},
        {"name":"Enabled",
            "editable": true,
            "object":"enabled",
            "type":"boolean"},
        {"name":"Domain",
            "editable": true,
            "object":"domain",
            "type":"string"},
        {"name":"Host",
            "editable": true,
            "object":"host",
            "type":"string"},
        {"name":"Hostname",
            "editable": true,
            "object":"hostname",
            "type":"string"},
        {"name":"IP Address",
            "editable": true,
            "object":"ip",
            "type":"string"},
        {"name":"Groups",
            "editable": true,
            "object":"groups",
            "method":"inGroup",
            "type":"select2"},
        {"name":"Variables",
            "editable": true,
            "object":"variables",
            "type":"jsoneditor"}
    ];
};
Host.prototype.toJSON = function () {
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
        "groups": d.groupsArr(),
        "variables": d.variables()
    };
    Object.keys(obj).map(function (property) {
        if (obj[property] === undefined || obj[property] === "") {
            if (typeof property !== "boolean") {
                delete obj[property];
            }
        }
    });
    return obj;
};
Host.update = function (host) {
    if (!(host instanceof Host)) {
        console.log("Argument needs to be of type Host.", host);
        return;
    }
    console.log(host);
    var base = "http://127.0.0.1:8000";
    var url = base + host.d.id();
    m.request({
        method: "PUT",
        url: url,
        data: host,
        type: Host
    }).then(log).then(Hosts.replace);
};
Host.post = function (host) {
    if (!(host instanceof Host)) {
        console.log("Argument needs to be of type Host.", host);
        return;
    }
    console.log(host);
    var base = "http://127.0.0.1:8000";
    var endpoint = "/hosts";
    var url = base + endpoint;
    m.request({
        method: "POST",
        url: url,
        data: host,
        type: Host
    }).then(log).then(Hosts.add);
};
Host.host = new Host();
Host.vm = (function () {
    var vm = {};
    vm.editorTitle = "Edit Host";
    var jseditor = {};
    vm.init = function () {
        vm.host = Host.host;
    };
    vm.groups = Groups.list();
    vm.edit = function (host, open) {
        open = typeof open !== "undefined" ? open : false;
        vm.host = host;
        if (open) {
            Host.vm.openModal("lg");
        }
    };
    vm.openModal = function (size) {
        vm.modalInstance = m.u.init(m.ui.modal({
            size: size,
            params: {
                vm: vm,
                object: "host"
            },
            module: EditModal,
            onopen: function () {
                // redraw first else it didn"t finish rendering the view yet
                m.redraw();
                vm.initJsonEditor();
                vm.initGroupSelect();
            }
        }));
        vm.modalInstance.result.then(function () {
            Host.vm.save(Host.vm.host);
        }, function () {
            console.log("Modal dismissed");
        });
    };
    vm.create = function () {
        vm.edit(new Host(), true);
    };
    vm.save = function (host) {
        if (jseditor.editor !== undefined) {
            host.d.variables(jseditor.editor.get());
        }
        if (host.d.id()) {
            vm.update(host);
        } else {
            vm.post(host);
        }
    };
    vm.update = function (data) {
        Host.update(data);
    };
    vm.post = function (data) {
        Host.post(data);
    };
    vm.inGroup = function (group) {
        if (vm.host.d.groupsArr().indexOf(group.d.id()) >= 0) {
            return true;
        }
        return false;
    };
    vm.modGroup = function (value) {
        console.log(value);
        if (vm.host.d.groupsArr().indexOf(value) === -1) {
            console.log("adding group", value);
            vm.host.d.groupsArr().push(value);
        } else {
            console.log("removing group", value);
            vm.host.d.groupsArr(vm.host.d.groupsArr().filter(function (el) {
                return el !== value;
            }));
        }
    };
    vm.initJsonEditor = function () {
        /* globals document, JSONEditor */
        if (jseditor.editor !== undefined) {
            jseditor.editor.destroy();
        }
        m.startComputation();
        vm.host.columns.filter(function(el){
            return el.type === "jsoneditor";
        }).forEach(function(editable) {
            console.log(editable);
            jseditor.editorContainer = document.getElementById(editable.type+editable.object);
            console.log(jseditor);
            jseditor.editorOptions = {};
            jseditor.editor = new JSONEditor(jseditor.editorContainer, jseditor.editorOptions);
            if (vm.host.d[editable.object]() === undefined) {
                vm.host.d[editable.object]({});
            }
            jseditor.editor.set(vm.host.d[editable.object]());
        });
        m.endComputation();
        m.redraw();
    };
    /* globals $ */
    vm.initGroupSelect = function () {
        vm.host.columns.filter(function(el){
            return el.type === "select2";
        }).forEach(function(editable) {
            var el = $("#"+editable.type+editable.object);
            if (el.hasClass("select2-hidden-accessible")) {
                // redraw to reflect the change, else it can sometimes show the old one
                el.select2("destroy");
                m.redraw();
            }
            el.select2();
            el.on("change", function () {
                m.startComputation();
                var groups = el.select2("val");
                // simply set the returned array as the new group list
                Host.vm.host.d.groupsArr(groups);
                m.endComputation();
                m.redraw();
            });
        });
    };
    vm.enableButton = function (host) {
        if (host.d.enabled()) {
            return m("button", {
                class: "btn btn-default btn-xs",
                onclick: function () {
                    host.d.enabled(false);
                    vm.save(host);
                }
            }, [m("span", { class: "glyphicon glyphicon-pause" })]);
        } else {
            return m("button", {
                class: "btn btn-default btn-xs",
                onclick: function () {
                    host.d.enabled(true);
                    vm.save(host);
                }
            }, [m("span", { class: "glyphicon glyphicon-play" })]);
        }
    };
    return vm;
})();
Host.controller = function () {
    var ctrl = this;
    Host.vm.init();
    ctrl.vm = Host.vm;
};
