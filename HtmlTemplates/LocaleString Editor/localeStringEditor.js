define([
  'jquery',
  'underscore',
  'backbone',
  'backbone-forms',
  'sharedjs/collections/languages/languagesCollection',
  'sharedjs/extensions/localeStringListItemView',
  'text!sharedtemplates/extension/localeStringEditorTemplate.html'
], function ($, _, backbone, backboneforms, languagesCollection, localeStringListItemView, localeStringEditorTemplate) {

    var localeStringEditor = backbone.Form.editors.Base.extend({
        tagName: 'div',
        initialize: function (options) {
            // Call parent constructor
            backbone.Form.editors.Base.prototype.initialize.call(this, options);
            this.settingsMode = false;
            if (options.schema.editorAttrs && options.schema.editorAttrs.settingMode) {
                this.settingsMode = true;
            }

            // Since we are operating on an object, make sure it's a clone!
            // Otherwise backbone forms can't see changes to the value (new and old value would always be the same because of reference comparison)
            var clonedValue = jQuery.extend(true, {}, this.value);
            this.$el.val(clonedValue);

            this.listenTo(window.appHelper.event_bus, 'lsvalueupdated', this.lsValueUpdated);

            this.events["change textarea[name='" + this.options.key + "']"] = "onChange";
            this.events["keydown textarea[name='" + this.options.key + "']"] = "onKeyDown";
            this.events["keyup textarea[name='" + this.options.key + "']"] = "onKeyUp";
        },
        events: {
            'change .editLanguage': 'editlanguageChange',
            'change .viewLanguage': 'viewlanguageChange',
            'focus': "onFocus",
            'click .js-locale-string-edit-button': "onEdit",
            'click .js-stop-edit-button': "onStopEdit",
            'click .js-form-view-button': "onFormViewButton",
            'click .js-list-view-button': "onListViewButton",
            'click .js-expand-textarea-button': "expandTextarea",
            'click .js-contract-textarea-button': "contractTextarea",
            'blur': function () {
                this.trigger('blur', this);
            },
        },
        onKeyDown: function (e) {
            if (e.keyCode == 13) {
                e.stopPropagation();
            }
        },
        onKeyUp: function (e) {
            this.onChange(e);
            if (e.keyCode == 13) {
                e.stopPropagation();
            }
        },
        onFocus: function () {
            this.trigger('focus', this);
        },
        onEdit: function () {
            this.$el.find("div.editor").show();
            this.$el.find("div.display").hide();
        },
        onStopEdit: function () {
            this.$el.find("div.editor").hide();
            this.$el.find("div.display").show();

            var display = this.$el.find('#display' + this.id);
            var dataLang = window.appHelper["userLanguage"];

            display.text(this.getValue()[dataLang][1].trim()); 
        },
        contractTextarea: function () {
            this.$el.find("textarea")
                .css({
                    'width': '',
                    'height': ''
                })
                .attr('rows', '4');

            this.toggleExpandedTextareaButtons(false);
        },
        expandTextarea: function () {
            this.$el.find("textarea")
                .css({
                    'width': '550px',
                    'height': ''
                })
                .attr('rows', '12');

            this.toggleExpandedTextareaButtons(true);
        },
        toggleExpandedTextareaButtons: function (isExpanded) {
            this.$el.find(".js-expand-textarea-button").toggleClass('hidden', isExpanded);
            this.$el.find(".js-contract-textarea-button").toggleClass('hidden', !isExpanded);
        },
        onFormViewButton: function () {
            this.contractTextarea();
            this.standardFormView.show();
            this.customListView.hide();
            this.$el.find("#customListViewTable" + this.id).empty();

            // Update text areas with new values
            var textValue = this.$el.val()[this.editlanguage.val()];
            if (textValue) {
                this.$el.find('#text' + this.id).html(textValue[1].trim());
            }
            var viewValue = this.$el.val()[this.viewlanguage.val()];
            if (viewValue) {
                this.$el.find('#view' + this.id).html(viewValue[1]);
            }
        },
        onListViewButton: function () {
            this.contractTextarea();
            this.standardFormView.hide();
            this.customListView.show();
            var self = this;
            var listContainer = this.$el.find("#customListViewTable" + this.id);
            if (listContainer == null) {
                return;
            }
            listContainer.empty();
            $.each(this.filteredLanguages.models, function (key, model) {
                var textString = "";
                var cultureName = model.get("Name");
                var cultureDisplayName = model.get("DisplayName");
                if (self.$el.val()[cultureName] != null && self.$el.val()[cultureName][1] !== null) {
                    textString = self.$el.val()[cultureName][1].trim();
                }
                var listItem = new localeStringListItemView({
                    Id: self.id,
                    Key: cultureName,
                    Language: cultureDisplayName,
                    Text: textString,
                    Name: self.key,
                    Readonly: self.schema.editorAttrs ? self.schema.editorAttrs.readonly : false
                });
                listContainer.append(listItem.render().el);
            });
        },
        onChange: function (event) {
            // The 'change' event should be triggered whenever something happens
            // that affects the result of `this.getValue()`.

            var values = this.$el.val();
            var currLang = this.$el.find('#curr' + this.id);
            var text = this.$el.find('#text' + this.id);
            var curr = currLang.val();
            var view = this.$el.find('#view' + this.id);
            var viewlanguage = this.$el.find('#viewlanguage' + this.id);

            if (curr != null && curr != "") {
                if (values[curr] == null) {
                    values[curr] = [];
                    var displayName = "";
                    $.each(this.languages.models, function (key, model) {
                        if (model.id == curr) {
                            displayName = model.get("DisplayName");
                        }
                    });
                    values[curr][0] = displayName;
                }
                if ( typeof values[curr][1] !== "string") {
                    values[curr][1] = "";
                }
                if (values[curr][1].trim() !== text.val().trim()) {
                    values[curr][1] = text.val(); //only change the value if it differs after trim!
                }
                if (event && event.type && event.type.toString().indexOf("key") !== 0) {
                    values[curr][1] = values[curr][1].trim();
                    text.val(values[curr][1]); //only trim value in textarea if not key-event!
                }
                if (viewlanguage.val() == curr) {
                    view.val(values[curr][1]);
                }
            }
            this.trigger('change', this);
        },
        lsValueUpdated: function (langValue) {
            if (langValue[2] != this.id) {
                return;
            }

            this.$el.val()[langValue[0]] = langValue[1];
            this.trigger('change', this);
        },
        editlanguageChange: function (e) {
            e.stopPropagation();

            var lang = this.editlanguage.val();
            var values = this.$el.val();
            var currLang = this.$el.find('#curr' + this.id);
            var view = this.$el.find('#view' + this.id);
            var text = this.$el.find('#text' + this.id);

            var curr = currLang.val();
            if (curr != null && curr != "" && values[curr] != null) {
                values[curr][1] = text.val();
                if (this.viewlanguage.val() == curr) {
                    view.val(values[curr][1]);
                }
            }

            if (values[lang] == null) {
                text.val("");
            } else {
                var langValue = values[lang];
                text.val(langValue[1]);
            }
            currLang.val(lang);
        },
        viewlanguageChange: function (e) {
            e.stopPropagation();
            var view = this.$el.find('#view' + this.id);
            var lang = this.viewlanguage.val();
            var values = this.$el.val();
            var langValueView = values[lang];
            if (langValueView == null) {
                view.val("");
            } else {
                view.val(langValueView[1]);
            }
        },
        render: function (value) {
            var self = this;

            if (!window.appHelper.languagesCollection) {
                window.appHelper.languagesCollection = new languagesCollection();
                window.appHelper.languagesCollection.fetch({
                    success: function() {
                        self.render();
                    }
                });

                return this;
            }

            this.filteredLanguages = this.languages = window.appHelper.languagesCollection;
            if (self.schema.editorAttrs && self.schema.editorAttrs.languages) {
                this.filteredLanguages = new Backbone.Collection();
                this.filteredLanguages.add(window.appHelper.languagesCollection.models.filter(function(model) {
                    return self.schema.editorAttrs.languages.indexOf(model.id) > -1;
                }));
            }

            var readonly = "";
            if (self.schema.editorAttrs) {
                if (self.schema.editorAttrs.readonly) {
                    readonly = "readonly";
                }
            }

            var displayStyle = "display:block";
            var editorStyle = "display:none";
            if (self.settingsMode) {
                displayStyle = "display:none";
                editorStyle = "display:block";
            }
            self.$el.html(_.template(localeStringEditorTemplate, { id: self.id, readonly: readonly, displayStyle: displayStyle, editorStyle: editorStyle, name: self.key }));

            var display = self.$el.find('#display' + self.id);
            var view = self.$el.find('#view' + self.id);
            var text = self.$el.find('#text' + self.id);
            var currLang = self.$el.find('#curr' + self.id);
            this.editlanguage = self.$el.find('#editlanguage' + self.id);
            this.viewlanguage = self.$el.find('#viewlanguage' + self.id);
            var dataLang = window.appHelper["userLanguage"];
            self.standardFormView = self.$el.find('#standardFormView' + self.id);
            self.customListView = self.$el.find('#customListView' + self.id);
            self.customListView.hide();

            if (!self.value) {
                self.value = [];
                $.each(self.languages.models, function (key, model) {
                    self.value[model.get("Name")] = [model.get("DisplayName"), ""];
                });
            }

            if (!value) {
                value = this.value;
            }

            $.each(self.filteredLanguages.models, function (key, model) {
                self.editlanguage.append($("<option></option>").attr("value", model.get("Name")).text(model.get("DisplayName")));
            });

            $.each(self.languages.models, function (key, model) {
                self.viewlanguage.append($("<option></option>").attr("value", model.get("Name")).text(model.get("DisplayName")));
            });

            if (dataLang != null) {
                this.editlanguage.val(dataLang);
                if (!this.editlanguage.val()) {
                    this.editlanguage.val(this.editlanguage.find("option").first().val());
                }
                this.viewlanguage.val(dataLang);
            }

            if (!readonly || readonly == "") {
                var tt = value[self.editlanguage.val()];
                if (tt != null) {
                    text.val(tt[1]);
                }
                currLang.val(this.editlanguage.val());
            }
            var ttv = value[this.viewlanguage.val()];
            if (ttv != null) {
                view.val(ttv[1]);
            }

            if (value[dataLang] != null) {
                display.text(value[dataLang][1]);
            }
            return self;

        },

        getValue: function () {
            return this.$el.val();
        },

        setValue: function (value, language) {
            // Since we are operating on an object, make sure it's a clone!
            // Otherwise backbone forms can't see changes to the value (new and old value would always be the same because of reference comparison)
            var clonedValue;
            if (_.isObject(value)) {
                clonedValue = jQuery.extend(true, {}, value);
            } else {
                clonedValue = jQuery.extend(true, {}, this.value);
                clonedValue[language][1] = value;
            }
            this.$el.val(clonedValue);

            this.render(clonedValue);
        },
    });

    return localeStringEditor;

});
