/**
 * jqGrid extension - Tree Grid
 * Tony Tomov tony@trirand.com, http://trirand.com/blog/
 * Changed by Oleg Kiriljuk, oleg.kiriljuk@ok-soft-gmbh.com
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/

/*jshint eqeqeq:false */
/*jslint browser: true, eqeq: true, plusplus: true, nomen: true, vars: true, white: true, todo: true */
/*global jQuery */
(function ($) {
	"use strict";
	var jgrid = $.jgrid, getAccessor = jgrid.getAccessor, stripPref = jgrid.stripPref, jqID = jgrid.jqID,
		treeGridFeedback = function () {
			var args = $.makeArray(arguments);
			args[0] = "treeGrid" + args[0].charAt(0).toUpperCase() + args[0].substring(1);
			args.unshift("");
			args.unshift("");
			args.unshift(this.p);
			return jgrid.feedback.apply(this, args);
		};
	jgrid.extend({
		setTreeNode: function (i, len) {
			return this.each(function () {
				var $t = this, $self = $($t), p = $t.p, rows = $t.rows;
				if (!$t.grid || !p.treeGrid) { return; }
				var tr, expCol = p.expColInd,
					expanded = p.treeReader.expanded_field,
					isLeaf = p.treeReader.leaf_field,
					getRowId = function (e) {
						return $(e.target).closest("tr.jqgrow").attr("id");
					},
					onClickTreeNode = function (e) {
						var item = p.data[p._index[stripPref(p.idPrefix, getRowId(e))]],
							collapseOrExpand = item[expanded] ? "collapse" : "expand";
						if (!item[isLeaf]) {
							$self.jqGrid(collapseOrExpand + "Row", item);
							$self.jqGrid(collapseOrExpand + "Node", item);
						}
						return false;
					},
					onClickTreeNodeWithSelection = function (e) {
						onClickTreeNode.call(this, e);
						$self.jqGrid("setSelection", getRowId(e));
						return false;
					};
				// TODO: replace with jqGridBeforeSelectRow event handler
				while (i < len) {
					tr = rows[i];
					$(tr.cells[expCol])
						.find("div.treeclick")
						.bind("click", onClickTreeNode);
					if (p.ExpandColClick === true) {
						$(tr.cells[expCol])
							.find("span.cell-wrapper")
							.bind("click", onClickTreeNodeWithSelection);
					}
					i++;
				}

			});
		},
		setTreeGrid: function () {
			return this.each(function () {
				var $t = this, p = $t.p, i = 0, ecol = false, nm, key, tkey, dupcols = [];
				if (!p.treeGrid) { return; }
				if (!p.treedatatype) { $.extend($t.p, { treedatatype: p.datatype }); }
				p.subGrid = false;
				p.altRows = false;
				p.pgbuttons = false;
				p.pginput = false;
				p.gridview = true;
				if (p.rowTotal === null) { p.rowNum = p.maxRowNum; }
				p.multiselect = false;
				p.rowList = [];
				p.expColInd = 0;
				//pico = "ui-icon-triangle-1-" + (p.direction==="rtl" ? "w" : "e");
				//p.treeIcons = $.extend({plus:pico,minus:"ui-icon-triangle-1-s",leaf:"ui-icon-radio-off"},p.treeIcons || {});
				p.treeIcons.plus = p.direction === "rtl" ? p.treeIcons.plusRtl : p.treeIcons.plusLtr;
				if (p.treeGridModel === "nested") {
					p.treeReader = $.extend({
						level_field: "level",
						left_field: "lft",
						right_field: "rgt",
						leaf_field: "isLeaf",
						expanded_field: "expanded",
						loaded: "loaded",
						icon_field: "icon"
					}, p.treeReader);
				} else if (p.treeGridModel === "adjacency") {
					p.treeReader = $.extend({
						level_field: "level",
						parent_id_field: "parent",
						leaf_field: "isLeaf",
						expanded_field: "expanded",
						loaded: "loaded",
						icon_field: "icon"
					}, p.treeReader);
				}
				for (key in p.colModel) {
					if (p.colModel.hasOwnProperty(key)) {
						nm = p.colModel[key].name;
						if (nm === p.ExpandColumn && !ecol) {
							ecol = true;
							p.expColInd = i;
						}
						i++;
						//
						for (tkey in p.treeReader) {
							if (p.treeReader.hasOwnProperty(tkey) && p.treeReader[tkey] === nm) {
								dupcols.push(nm);
							}
						}
					}
				}
				$.each(p.treeReader, function (j, n) {
					if (n && $.inArray(n, dupcols) === -1) {
						if (j === "leaf_field") { p._treeleafpos = i; }
						i++;
						p.additionalProperties.push(n);
					}
				});
			});
		},
		expandRow: function (record) {
			this.each(function () {
				var $t = this, $self = $($t), p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var expanded = p.treeReader.expanded_field, rowid = record[p.localReader.id]; // without prefix
				if (!treeGridFeedback.call($t, "beforeExpandRow", { rowid: rowid, item: record })) { return; }
				var childern = $self.jqGrid("getNodeChildren", record);
				$(childern).each(function () {
					var id = p.idPrefix + getAccessor(this, p.localReader.id);
					$($self.jqGrid("getGridRowById", id)).css("display", "");
					if (this[expanded]) {
						$self.jqGrid("expandRow", this);
					}
				});
				treeGridFeedback.call($t, "afterExpandRow", { rowid: rowid, item: record });
			});
		},
		collapseRow: function (record) {
			this.each(function () {
				var $t = this, $self = $($t), p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var expanded = p.treeReader.expanded_field, rowid = record[p.localReader.id]; // without prefix
				if (!treeGridFeedback.call($t, "beforeCollapseRow", { rowid: rowid, item: record })) { return; }
				var childern = $self.jqGrid("getNodeChildren", record);
				$(childern).each(function () {
					var id = p.idPrefix + getAccessor(this, p.localReader.id);
					$($self.jqGrid("getGridRowById", id)).css("display", "none");
					if (this[expanded]) {
						$self.jqGrid("collapseRow", this);
					}
				});
				treeGridFeedback.call($t, "afterCollapseRow", { rowid: rowid, item: record });
			});
		},
		// NS ,adjacency models
		getRootNodes: function () {
			var result = [];
			this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				switch (p.treeGridModel) {
				case "nested":
					var level = p.treeReader.level_field;
					$(p.data).each(function () {
						if (parseInt(this[level], 10) === parseInt(p.tree_root_level, 10)) {
							result.push(this);
						}
					});
					break;
				case "adjacency":
					var parentId = p.treeReader.parent_id_field;
					$(p.data).each(function () {
						if (this[parentId] === null || String(this[parentId]).toLowerCase() === "null") {
							result.push(this);
						}
					});
					break;
				}
			});
			return result;
		},
		getNodeDepth: function (rc) {
			var ret = null;
			this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				switch (p.treeGridModel) {
				case "nested":
					var level = p.treeReader.level_field;
					ret = parseInt(rc[level], 10) - parseInt(p.tree_root_level, 10);
					break;
				case "adjacency":
					ret = $($t).jqGrid("getNodeAncestors", rc).length;
					break;
				}
			});
			return ret;
		},
		getNodeParent: function (rc) {
			var $t = this[0];
			if (!$t || !$t.grid || $t.p == null || !$t.p.treeGrid || rc == null) { return null; }
			var p = $t.p, parentIdName = p.treeReader.parent_id_field, parentId = rc[parentIdName];
			if (parentId === null || parentId === "null") { return null; }
			var iParent = p._index[parentId];
			return iParent != undefined ? p.data[iParent] : null;
		},
		getNodeChildren: function (rc) {
			var result = [];
			this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				switch (p.treeGridModel) {
				case "nested":
					var lftc = p.treeReader.left_field, rgtc = p.treeReader.right_field, levelc = p.treeReader.level_field,
						lft = parseInt(rc[lftc], 10),
						rgt = parseInt(rc[rgtc], 10),
						level = parseInt(rc[levelc], 10);
					$(p.data).each(function () {
						if (parseInt(this[levelc], 10) === level + 1 && parseInt(this[lftc], 10) > lft && parseInt(this[rgtc], 10) < rgt) {
							result.push(this);
						}
					});
					break;
				case "adjacency":
					var parentId = p.treeReader.parent_id_field, dtid = p.localReader.id;
					$(p.data).each(function () {
						if (String(this[parentId]) === String(rc[dtid])) {
							result.push(this);
						}
					});
					break;
				}
			});
			return result;
		},
		getFullTreeNode: function (rc) {
			var result = [];
			this.each(function () {
				var $t = this, p = $t.p, len;
				if (!$t.grid || !p.treeGrid) { return; }
				switch (p.treeGridModel) {
				case "nested":
					var lftc = p.treeReader.left_field, rgtc = p.treeReader.right_field, levelc = p.treeReader.level_field,
						lft = parseInt(rc[lftc], 10),
						rgt = parseInt(rc[rgtc], 10),
						level = parseInt(rc[levelc], 10);
					$(p.data).each(function () {
						if (parseInt(this[levelc], 10) >= level && parseInt(this[lftc], 10) >= lft && parseInt(this[lftc], 10) <= rgt) {
							result.push(this);
						}
					});
					break;
				case "adjacency":
					if (rc) {
						result.push(rc);
						var parentId = p.treeReader.parent_id_field, dtid = p.localReader.id;
						$(p.data).each(function () {
							var i;
							len = result.length;
							for (i = 0; i < len; i++) {
								if (result[i][dtid] === this[parentId]) {
									result.push(this);
									break;
								}
							}
						});
					}
					break;
				}
			});
			return result;
		},
		// End NS, adjacency Model
		getNodeAncestors: function (rc) {
			var ancestors = [];
			this.each(function () {
				var $t = this, $self = $($t);
				if (!$t.grid || !$t.p.treeGrid) { return; }
				var parent = $self.jqGrid("getNodeParent", rc);
				while (parent) {
					ancestors.push(parent);
					parent = $self.jqGrid("getNodeParent", parent);
				}
			});
			return ancestors;
		},
		isVisibleNode: function (rc) {
			var result = true;
			this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var ancestors = $($t).jqGrid("getNodeAncestors", rc), expanded = p.treeReader.expanded_field;
				$(ancestors).each(function () {
					result = result && this[expanded];
					if (!result) { return false; }
				});
			});
			return result;
		},
		isNodeLoaded: function (rc) {
			var result;
			this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var isLeaf = p.treeReader.leaf_field, loaded = p.treeReader.loaded;
				if (rc !== undefined) {
					if (rc[loaded] !== undefined) {
						result = rc[loaded];
					} else if (rc[isLeaf] || $($t).jqGrid("getNodeChildren", rc).length > 0) {
						result = true;
					} else {
						result = false;
					}
				} else {
					result = false;
				}
			});
			return result;
		},
		expandNode: function (rc) {
			return this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var expanded = p.treeReader.expanded_field, parent = p.treeReader.parent_id_field, loaded = p.treeReader.loaded,
					level = p.treeReader.level_field,
					lft = p.treeReader.left_field,
					rgt = p.treeReader.right_field;

				if (!rc[expanded]) {
					var id = getAccessor(rc, p.localReader.id);
					if (!treeGridFeedback.call($t, "beforeExpandNode", { rowid: id, item: rc })) { return; }
					var rc1 = $("#" + p.idPrefix + jqID(id), $t.grid.bDiv)[0],
						position = p._index[id];
					if ($($t).jqGrid("isNodeLoaded", p.data[position])) {
						rc[expanded] = true;
						$("div.treeclick", rc1).removeClass(p.treeIcons.plus + " tree-plus").addClass(p.treeIcons.minus + " tree-minus");
					} else if (!$t.grid.hDiv.loading) {
						rc[expanded] = true;
						$("div.treeclick", rc1).removeClass(p.treeIcons.plus + " tree-plus").addClass(p.treeIcons.minus + " tree-minus");
						p.treeANode = rc1.rowIndex;
						p.datatype = p.treedatatype;
						$($t).jqGrid("setGridParam", {
							postData: p.treeGridModel === "nested" ?
									{ nodeid: id, n_level: rc[level], n_left: rc[lft], n_right: rc[rgt] } :
									{ nodeid: id, n_level: rc[level], parentid: rc[parent] }
						});
						$($t).trigger("reloadGrid");
						rc[loaded] = true;
						$($t).jqGrid("setGridParam", {
							postData: p.treeGridModel === "nested" ?
									{ nodeid: "", n_level: "", n_left: "", n_right: "" } :
									{ nodeid: "", n_level: "", parentid: "" }
						});
					}
					treeGridFeedback.call($t, "afterExpandNode", { rowid: id, item: rc });
				}
			});
		},
		collapseNode: function (rc) {
			return this.each(function () {
				var $t = this, p = $t.p;
				if (!$t.grid || !p.treeGrid) { return; }
				var expanded = p.treeReader.expanded_field;
				if (rc[expanded]) {
					var id = getAccessor(rc, p.localReader.id);
					if (!treeGridFeedback.call($t, "beforeCollapseNode", { rowid: id, item: rc })) { return; }
					rc[expanded] = false;
					var rc1 = $("#" + p.idPrefix + jqID(id), $t.grid.bDiv)[0];
					$("div.treeclick", rc1).removeClass(p.treeIcons.minus + " tree-minus").addClass(p.treeIcons.plus + " tree-plus");
					treeGridFeedback.call($t, "afterCollapseNode", { rowid: id, item: rc });
				}
			});
		},
		SortTree: function (sortname, newDir, st, datefmt) {
			return this.each(function () {
				var $t = this, p = $t.p, $self = $($t);
				if (!$t.grid || !p.treeGrid) { return; }
				var i, len, rec, records = [], rt = $self.jqGrid("getRootNodes"), query = jgrid.from.call($t, rt);
				// Sorting roots
				query.orderBy(sortname, newDir, st, datefmt);
				var roots = query.select();

				// Sorting children
				for (i = 0, len = roots.length; i < len; i++) {
					rec = roots[i];
					records.push(rec);
					$self.jqGrid("collectChildrenSortTree", records, rec, sortname, newDir, st, datefmt);
				}
				$.each(records, function (index) {
					var id = getAccessor(this, p.localReader.id);
					$($t.rows[index]).after($self.find(">tbody>tr#" + jqID(id)));
				});
			});
		},
		collectChildrenSortTree: function (records, rec, sortname, newDir, st, datefmt) {
			return this.each(function () {
				var $t = this, $self = $($t);
				if (!$t.grid || !$t.p.treeGrid) { return; }
				var i, len, child, ch = $self.jqGrid("getNodeChildren", rec), query = jgrid.from.call($t, ch);
				query.orderBy(sortname, newDir, st, datefmt);
				var children = query.select();
				for (i = 0, len = children.length; i < len; i++) {
					child = children[i];
					records.push(child);
					$self.jqGrid("collectChildrenSortTree", records, child, sortname, newDir, st, datefmt);
				}
			});
		},
		// experimental 
		setTreeRow: function (rowid, data) {
			var success = false;
			this.each(function () {
				var t = this;
				if (!t.grid || !t.p.treeGrid) { return; }
				success = $(t).jqGrid("setRowData", rowid, data);
			});
			return success;
		},
		delTreeNode: function (rowid) {
			return this.each(function () {
				var $t = this, p = $t.p, myright, width, res, key, rid = p.localReader.id, i, $self = $($t),
					left = p.treeReader.left_field,
					right = p.treeReader.right_field;
				if (!$t.grid || !p.treeGrid) { return; }
				var rc = p._index[rowid];
				if (rc !== undefined) {
					// nested
					myright = parseInt(p.data[rc][right], 10);
					width = myright - parseInt(p.data[rc][left], 10) + 1;
					var dr = $self.jqGrid("getFullTreeNode", p.data[rc]);
					if (dr.length > 0) {
						for (i = 0; i < dr.length; i++) {
							$self.jqGrid("delRowData", dr[i][rid]);
						}
					}
					if (p.treeGridModel === "nested") {
						// ToDo - update grid data
						res = jgrid.from.call($t, p.data)
							.greater(left, myright, { stype: "integer" })
							.select();
						if (res.length) {
							for (key in res) {
								if (res.hasOwnProperty(key)) {
									res[key][left] = parseInt(res[key][left], 10) - width;
								}
							}
						}
						res = jgrid.from.call($t, p.data)
							.greater(right, myright, { stype: "integer" })
							.select();
						if (res.length) {
							for (key in res) {
								if (res.hasOwnProperty(key)) {
									res[key][right] = parseInt(res[key][right], 10) - width;
								}
							}
						}
					}
				}
			});
		},
		addChildNode: function (nodeid, parentid, data, expandData) {
			//return this.each(function(){
			var $self = $(this), $t = $self[0], p = $t.p;
			if (data) {
				// we suppose tha the id is autoincremet and
				var method, parentindex, parentdata, parentlevel, i, len, max = 0, rowind = parentid, leaf, maxright,
					expanded = p.treeReader.expanded_field, isLeaf = p.treeReader.leaf_field, level = p.treeReader.level_field,
					//icon = p.treeReader.icon_field,
					parent = p.treeReader.parent_id_field,
					left = p.treeReader.left_field,
					right = p.treeReader.right_field,
					loaded = p.treeReader.loaded;
				if (expandData === undefined) { expandData = false; }
				if (nodeid == null) {
					i = p.data.length - 1;
					if (i >= 0) {
						while (i >= 0) { max = Math.max(max, parseInt(p.data[i][p.localReader.id], 10)); i--; }
					}
					nodeid = max + 1;
				}
				var prow = $self.jqGrid("getInd", parentid);
				leaf = false;
				// if not a parent we assume root
				if (parentid === undefined || parentid === null || parentid === "") {
					parentid = null;
					rowind = null;
					method = "last";
					parentlevel = p.tree_root_level;
					i = p.data.length + 1;
				} else {
					method = "after";
					parentindex = p._index[parentid];
					parentdata = p.data[parentindex];
					parentid = parentdata[p.localReader.id];
					parentlevel = parseInt(parentdata[level], 10) + 1;
					var childs = $self.jqGrid("getFullTreeNode", parentdata);
					// if there are child nodes get the last index of it
					if (childs.length) {
						i = childs[childs.length - 1][p.localReader.id];
						rowind = i;
						i = $self.jqGrid("getInd", rowind) + 1;
					} else {
						i = $self.jqGrid("getInd", parentid) + 1;
					}
					// if the node is leaf
					if (parentdata[isLeaf]) {
						leaf = true;
						parentdata[expanded] = true;
						//var prow = $self.jqGrid("getInd", parentid);
						$($t.rows[prow])
							.find("span.cell-wrapperleaf").removeClass("cell-wrapperleaf").addClass("cell-wrapper")
							.end()
							.find("div.tree-leaf").removeClass(p.treeIcons.leaf + " tree-leaf").addClass(p.treeIcons.minus + " tree-minus");
						p.data[parentindex][isLeaf] = false;
						parentdata[loaded] = true;
					}
				}
				len = i + 1;

				if (data[expanded] === undefined) { data[expanded] = false; }
				if (data[loaded] === undefined) { data[loaded] = false; }
				data[level] = parentlevel;
				if (data[isLeaf] === undefined) { data[isLeaf] = true; }
				if (p.treeGridModel === "adjacency") {
					data[parent] = parentid;
				}
				if (p.treeGridModel === "nested") {
					// this method requiere more attention
					var query, res, key;
					//maxright = parseInt(maxright,10);
					// ToDo - update grid data
					if (parentid !== null) {
						maxright = parseInt(parentdata[right], 10);
						query = jgrid.from.call($t, p.data);
						query = query.greaterOrEquals(right, maxright, { stype: "integer" });
						res = query.select();
						if (res.length) {
							for (key in res) {
								if (res.hasOwnProperty(key)) {
									res[key][left] = res[key][left] > maxright ? parseInt(res[key][left], 10) + 2 : res[key][left];
									res[key][right] = res[key][right] >= maxright ? parseInt(res[key][right], 10) + 2 : res[key][right];
								}
							}
						}
						data[left] = maxright;
						data[right] = maxright + 1;
					} else {
						maxright = parseInt($self.jqGrid("getCol", right, false, "max"), 10);
						res = jgrid.from.call($t, p.data)
							.greater(left, maxright, { stype: "integer" })
							.select();
						if (res.length) {
							for (key in res) {
								if (res.hasOwnProperty(key)) {
									res[key][left] = parseInt(res[key][left], 10) + 2;
								}
							}
						}
						res = jgrid.from.call($t, p.data)
							.greater(right, maxright, { stype: "integer" })
							.select();
						if (res.length) {
							for (key in res) {
								if (res.hasOwnProperty(key)) {
									res[key][right] = parseInt(res[key][right], 10) + 2;
								}
							}
						}
						data[left] = maxright + 1;
						data[right] = maxright + 2;
					}
				}
				if (parentid === null || $self.jqGrid("isNodeLoaded", parentdata) || leaf) {
					$self.jqGrid("addRowData", nodeid, data, method, rowind);
					$self.jqGrid("setTreeNode", i, len);
				}
				if (parentdata && !parentdata[expanded] && expandData) {
					$($t.rows[prow])
						.find("div.treeclick")
						.click();
				}
			}
			//});
		}
	});
}(jQuery));
