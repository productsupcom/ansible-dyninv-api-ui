var Group = function (data) {
    this.d = {};
    var d = this.d;
    d.id = data ? m.prop(data["@id"]) : m.prop("");
    d.name = data ? m.prop(data.name) : m.prop("");
    d.enabled = data ? m.prop(data.enabled) : m.prop("");
    d.hostsCount = function() {
        return d.hostsArr().length;
    };
    d.variables = data ? m.prop(data.variables) : m.prop({});
    if (Array.isArray(d.variables())) {
        d.variables({});
    }
    d.hostsArr = data ? m.prop(data.hosts) : m.prop([]);
    d.childArr = data ? m.prop(data.childGroups) : m.prop([]);
    d.parentArr = data ? m.prop(data.parentGroups) : m.prop([]);
    d.hosts = function () {
        return Hosts.list().filter(function (el) {
            return d.hostsArr().indexOf(el.d.id()) !== -1;
        });
    };

    this.inplace = m.prop(false);
    this.columns = [
        {"name":"ID",
            "inplace": false,
            "editable": false,
            "object":"id",
            "type":"integer"},
        {"name":"Enabled",
            "inplace": false,
            "editable": true,
            "object":"enabled",
            "type":"boolean"},
        {"name":"Name",
            "inplace": true,
            "editable": true,
            "object":"name",
            "type":"string"},
        {"name":"Hosts",
            "inplace": false,
            "editable": true,
            "object":"hosts",
            "method":"inHost",
            "type":"select2"},
        {"name":"Hosts",
            "inplace": false,
            "editable": false,
            "object":"hostsCount",
            "type":"string"},
        {"name":"Variables",
            "inplace": false,
            "editable": true,
            "object":"variables",
            "type":"jsoneditor"}
    ];
};
Group.prototype.toJSON = function () {
    var d = this.d;
    var obj = {
        "@id": d.id(),
        "name": d.name(),
        "enabled": d.enabled(),
        "variables": d.variables(),
        "hosts": d.hostsArr(),
        "childGroups": d.childArr(),
        "parentGroups": d.parentArr(),
        //"hosts": d.hosts().map(function(host){
        //    return host.d.id();
        //})
    };
    console.log(obj);
    Object.keys(obj).map(function (property) {
        if (obj[property] === undefined || obj[property] === "") {
            if (typeof property !== "boolean") {
                delete obj[property];
            }
        }
    });
    console.log(obj);
    return obj;
};

Group.update = function (group) {
    if (Login.token() === null) {
        m.route("/login");
    }
    if (!(group instanceof Group)) {
        console.log("Argument needs to be of type Group.", group);
        return;
    }
    console.log(group);
    var url = uiConfig.restUrl + group.d.id();
    api.request({
        method: "PUT",
        url: url,
        data: group,
        type: Group
    }).catch(function(e){
        console.log(e.message);
    }).then(log).then(Groups.replace);
};

Group.post = function (group) {
    if (Login.token() === null) {
        m.route("/login");
    }
    if (!(group instanceof Group)) {
        console.log("Argument needs to be of type Group.", group);
        return;
    }
    console.log(group);
    var base = uiConfig.restUrl;
    var endpoint = "/api/groups";
    var url = base + endpoint;
    api.request({
        method: "POST",
        url: url,
        data: group,
        type: Group
    }).catch(function(e){
        console.log(e.message);
    }).then(log).then(Groups.add);
};

Group.group = new Group();

Group.vm = (function() {
    var vm = {};
    vm.editorTitle = "Edit Group";
    var jseditor = {};
    vm.init = function() {
        vm.group = Group.group;
    };

    vm.create = function () {
        vm.edit(new Group(), true);
    };

    vm.save = function (group) {
        console.log(group);
        console.log(group.d.hosts());
        if (jseditor.editor !== undefined) {
            group.d.variables(jseditor.editor.get());
        }
        if (group.d.id()) {
            console.log("update", group);
            vm.update(group);
        } else {
            console.log("create", group);
            vm.post(group);
        }
    };
    vm.update = function (data) {
        Group.update(data);
    };
    vm.post = function (data) {
        Group.post(data);
    };

    vm.inHost = function (host) {
        if (vm.group.d.hostsArr().indexOf(host.d.id()) >= 0) {
            return true;
        }
        return false;
    };

    vm.edit = function (group, open) {
        open = typeof open !== "undefined" ? open : false;
        vm.group = group;
        if (open) {
            Group.vm.openModal("lg");
        }
    };

    vm.addGroupToHost = function(group, host) {
        console.log("addGroupToHost", group, host);
        if (group.d.hostsArr().indexOf(host) === -1) {
            console.log("adding host", host);
            group.d.hostsArr().push(host);
        }
    };

    vm.openModal = function (size) {
        console.log("opening");
        vm.modalInstance = m.u.init(m.ui.modal({
            size: size,
            params: {
                vm: vm,
                object: "group"
            },
            module: EditModal,
            onopen: function () {
                // redraw first else it didn"t finish rendering the view yet
                m.redraw(true);
                // needs to be reimplemented for the group
                vm.initJsonEditor();
                vm.initHostSelect();
            }
        }));
        vm.modalInstance.result.then(function () {
            console.log(Group.vm.group);
            Group.vm.save(Group.vm.group);
        }, function () {
            console.log("Modal dismissed");
        });
    };

    vm.initJsonEditor = function () {
        /* globals document, JSONEditor */
        if (jseditor.editor !== undefined) {
            jseditor.editor.destroy();
        }
        m.startComputation();
        vm.group.columns.filter(function(el){
            return el.type === "jsoneditor";
        }).forEach(function(editable) {
            console.log(editable);
            jseditor.editorContainer = document.getElementById(editable.type+editable.object);
            console.log(jseditor);
            if (jseditor.editorContainer) {
                jseditor.editorOptions = {};
                jseditor.editor = new JSONEditor(jseditor.editorContainer, jseditor.editorOptions);
                console.log(vm.group.d[editable.object]());
                if (vm.group.d[editable.object]() === undefined) {
                    vm.group.d[editable.object]({});
                }
                jseditor.editor.set(vm.group.d[editable.object]());
            } else {
                console.log("Mysterious forces have caused the editorContainer not to be available.");
            }
        });
        m.endComputation();
        m.redraw();
    };

    /* globals $ */
    vm.initHostSelect = function () {
        vm.group.columns.filter(function(el){
            return el.type === "select2";
        }).forEach(function(editable) {
            var el = $("#"+editable.type+editable.object);
            if (el.hasClass("select2-hidden-accessible")) {
                // redraw to reflect the change, else it can sometimes show the old one
                el.select2("destroy");
                m.redraw();
            }
            el.select2({width: "830px"});
            el.on("change", function () {
                m.startComputation();
                var hosts = el.select2("val");
                // simply set the returned array as the new host list
                Group.vm.group.d.hostsArr(hosts);
                m.endComputation();
                m.redraw();
            });
        });
    };
    vm.enableButton = function (group) {
        if (group.d.enabled()) {
            return m("button", {
                class: "btn btn-default btn-xs",
                onclick: function () {
                    group.d.enabled(false);
                    vm.save(group);
                }
            }, [m("span", { class: "glyphicon glyphicon-pause" })]);
        } else {
            return m("button", {
                class: "btn btn-default btn-xs",
                onclick: function () {
                    group.d.enabled(true);
                    vm.save(group);
                }
            }, [m("span", { class: "glyphicon glyphicon-play" })]);
        }
    };

    return vm;
})();

Group.controller = function() {
    var ctrl = this;
    Group.vm.init();
    ctrl.vm = Group.vm;
};
