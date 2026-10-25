package partkam_fla
{
   import adobe.utils.*;
   import fl.controls.Button;
   import fl.controls.CheckBox;
   import fl.controls.ComboBox;
   import fl.controls.List;
   import fl.data.DataProvider;
   import fl.data.SimpleCollectionItem;
   import flash.accessibility.*;
   import flash.desktop.*;
   import flash.display.*;
   import flash.errors.*;
   import flash.events.*;
   import flash.external.*;
   import flash.filters.*;
   import flash.geom.*;
   import flash.globalization.*;
   import flash.media.*;
   import flash.net.*;
   import flash.net.drm.*;
   import flash.printing.*;
   import flash.profiler.*;
   import flash.sampler.*;
   import flash.sensors.*;
   import flash.system.*;
   import flash.text.*;
   import flash.text.engine.*;
   import flash.text.ime.*;
   import flash.ui.*;
   import flash.utils.*;
   import flash.xml.*;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol178")]
   public dynamic class tools_1 extends MovieClip
   {
      
      public var tool3:MovieClip;
      
      public var dEdit:List;
      
      public var background:MovieClip;
      
      public var tool4:MovieClip;
      
      public var dInsert:List;
      
      public var unit:ComboBox;
      
      public var snap:CheckBox;
      
      public var dCAM:List;
      
      public var dFile:List;
      
      public var zoomout:Button;
      
      public var zoomin:Button;
      
      public var mNesting:MovieClip;
      
      public var mEdit:MovieClip;
      
      public var mInsert:MovieClip;
      
      public var mCAM:MovieClip;
      
      public var viewcuts:CheckBox;
      
      public var mFile:MovieClip;
      
      public var tool0:MovieClip;
      
      public var dToolpaths:List;
      
      public var tool1:MovieClip;
      
      public var tool2:MovieClip;
      
      public var dNesting:List;
      
      public var mToolpaths:MovieClip;
      
      public function tools_1()
      {
         super();
         this.__setProp_zoomin_tools_Layer1_0();
         this.__setProp_zoomout_tools_Layer1_0();
         this.__setProp_unit_tools_Layer1_0();
         this.__setProp_dFile_tools_Layer1_0();
         this.__setProp_dEdit_tools_Layer1_0();
         this.__setProp_dInsert_tools_Layer1_0();
         this.__setProp_dCAM_tools_Layer1_0();
         this.__setProp_viewcuts_tools_Layer1_0();
         this.__setProp_snap_tools_Layer1_0();
         this.__setProp_dToolpaths_tools_Layer1_0();
         this.__setProp_dNesting_tools_Layer1_0();
      }
      
      internal function __setProp_zoomin_tools_Layer1_0() : *
      {
         try
         {
            this.zoomin["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.zoomin.emphasized = false;
         this.zoomin.enabled = true;
         this.zoomin.label = "+";
         this.zoomin.labelPlacement = "right";
         this.zoomin.selected = false;
         this.zoomin.toggle = false;
         this.zoomin.visible = true;
         try
         {
            this.zoomin["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_zoomout_tools_Layer1_0() : *
      {
         try
         {
            this.zoomout["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.zoomout.emphasized = false;
         this.zoomout.enabled = true;
         this.zoomout.label = "-";
         this.zoomout.labelPlacement = "right";
         this.zoomout.selected = false;
         this.zoomout.toggle = false;
         this.zoomout.visible = true;
         try
         {
            this.zoomout["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_unit_tools_Layer1_0() : *
      {
         var itemObj0:SimpleCollectionItem = null;
         var collProps0:Array = null;
         var collProp0:Object = null;
         var i0:int = 0;
         var j0:* = undefined;
         try
         {
            this.unit["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         var collObj0:DataProvider = new DataProvider();
         collProps0 = [{
            "label":"inch",
            "data":"in"
         },{
            "label":"cm",
            "data":"cm"
         }];
         for(i0 = 0; i0 < collProps0.length; i0++)
         {
            itemObj0 = new SimpleCollectionItem();
            collProp0 = collProps0[i0];
            for(j0 in collProp0)
            {
               itemObj0[j0] = collProp0[j0];
            }
            collObj0.addItem(itemObj0);
         }
         this.unit.dataProvider = collObj0;
         this.unit.editable = false;
         this.unit.enabled = true;
         this.unit.prompt = "";
         this.unit.restrict = "";
         this.unit.rowCount = 5;
         this.unit.visible = true;
         try
         {
            this.unit["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dFile_tools_Layer1_0() : *
      {
         var itemObj1:SimpleCollectionItem = null;
         var collProps1:Array = null;
         var collProp1:Object = null;
         var i1:int = 0;
         var j1:* = undefined;
         try
         {
            this.dFile["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dFile.allowMultipleSelection = false;
         var collObj1:DataProvider = new DataProvider();
         collProps1 = [{
            "label":"Open SVG File",
            "data":0
         },{
            "label":"Save SVG File",
            "data":1
         }];
         for(i1 = 0; i1 < collProps1.length; i1++)
         {
            itemObj1 = new SimpleCollectionItem();
            collProp1 = collProps1[i1];
            for(j1 in collProp1)
            {
               itemObj1[j1] = collProp1[j1];
            }
            collObj1.addItem(itemObj1);
         }
         this.dFile.dataProvider = collObj1;
         this.dFile.enabled = true;
         this.dFile.horizontalLineScrollSize = 4;
         this.dFile.horizontalPageScrollSize = 0;
         this.dFile.horizontalScrollPolicy = "auto";
         this.dFile.verticalLineScrollSize = 4;
         this.dFile.verticalPageScrollSize = 0;
         this.dFile.verticalScrollPolicy = "off";
         this.dFile.visible = true;
         try
         {
            this.dFile["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dEdit_tools_Layer1_0() : *
      {
         var itemObj2:SimpleCollectionItem = null;
         var collProps2:Array = null;
         var collProp2:Object = null;
         var i2:int = 0;
         var j2:* = undefined;
         try
         {
            this.dEdit["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dEdit.allowMultipleSelection = false;
         var collObj2:DataProvider = new DataProvider();
         collProps2 = [{
            "label":"Undo",
            "data":8
         },{
            "label":"Redo",
            "data":9
         },{
            "label":"Copy",
            "data":0
         },{
            "label":"Paste",
            "data":1
         },{
            "label":"Scale Selected",
            "data":2
         },{
            "label":"Rotate Selected",
            "data":3
         },{
            "label":"Skew Selected",
            "data":4
         },{
            "label":"Separate Selected",
            "data":5
         },{
            "label":"Set Background",
            "data":6
         },{
            "label":"Edit Preferences",
            "data":7
         }];
         for(i2 = 0; i2 < collProps2.length; i2++)
         {
            itemObj2 = new SimpleCollectionItem();
            collProp2 = collProps2[i2];
            for(j2 in collProp2)
            {
               itemObj2[j2] = collProp2[j2];
            }
            collObj2.addItem(itemObj2);
         }
         this.dEdit.dataProvider = collObj2;
         this.dEdit.enabled = true;
         this.dEdit.horizontalLineScrollSize = 4;
         this.dEdit.horizontalPageScrollSize = 0;
         this.dEdit.horizontalScrollPolicy = "auto";
         this.dEdit.verticalLineScrollSize = 4;
         this.dEdit.verticalPageScrollSize = 0;
         this.dEdit.verticalScrollPolicy = "off";
         this.dEdit.visible = true;
         try
         {
            this.dEdit["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dInsert_tools_Layer1_0() : *
      {
         var itemObj3:SimpleCollectionItem = null;
         var collProps3:Array = null;
         var collProp3:Object = null;
         var i3:int = 0;
         var j3:* = undefined;
         try
         {
            this.dInsert["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dInsert.allowMultipleSelection = false;
         var collObj3:DataProvider = new DataProvider();
         collProps3 = [{
            "label":"Circle",
            "data":0
         },{
            "label":"Ellipse",
            "data":1
         },{
            "label":"Rectangle",
            "data":2
         },{
            "label":"Rounded Rectangle",
            "data":3
         },{
            "label":"Polygon",
            "data":4
         },{
            "label":"Star",
            "data":5
         }];
         for(i3 = 0; i3 < collProps3.length; i3++)
         {
            itemObj3 = new SimpleCollectionItem();
            collProp3 = collProps3[i3];
            for(j3 in collProp3)
            {
               itemObj3[j3] = collProp3[j3];
            }
            collObj3.addItem(itemObj3);
         }
         this.dInsert.dataProvider = collObj3;
         this.dInsert.enabled = true;
         this.dInsert.horizontalLineScrollSize = 4;
         this.dInsert.horizontalPageScrollSize = 0;
         this.dInsert.horizontalScrollPolicy = "auto";
         this.dInsert.verticalLineScrollSize = 4;
         this.dInsert.verticalPageScrollSize = 0;
         this.dInsert.verticalScrollPolicy = "off";
         this.dInsert.visible = true;
         try
         {
            this.dInsert["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dCAM_tools_Layer1_0() : *
      {
         var itemObj4:SimpleCollectionItem = null;
         var collProps4:Array = null;
         var collProp4:Object = null;
         var i4:int = 0;
         var j4:* = undefined;
         try
         {
            this.dCAM["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dCAM.allowMultipleSelection = false;
         var collObj4:DataProvider = new DataProvider();
         collProps4 = [{
            "label":"profile operation",
            "data":0
         },{
            "label":"pocket operation",
            "data":1
         },{
            "label":"follow path operation",
            "data":2
         },{
            "label":"drill operation",
            "data":3
         },{
            "label":"add tabs to selected",
            "data":4
         },{
            "label":"calculate all",
            "data":5
         },{
            "label":"calculate selected",
            "data":6
         },{
            "label":"batch modify",
            "data":7
         },{
            "label":"export gcode",
            "data":8
         }];
         for(i4 = 0; i4 < collProps4.length; i4++)
         {
            itemObj4 = new SimpleCollectionItem();
            collProp4 = collProps4[i4];
            for(j4 in collProp4)
            {
               itemObj4[j4] = collProp4[j4];
            }
            collObj4.addItem(itemObj4);
         }
         this.dCAM.dataProvider = collObj4;
         this.dCAM.enabled = true;
         this.dCAM.horizontalLineScrollSize = 4;
         this.dCAM.horizontalPageScrollSize = 0;
         this.dCAM.horizontalScrollPolicy = "auto";
         this.dCAM.verticalLineScrollSize = 4;
         this.dCAM.verticalPageScrollSize = 0;
         this.dCAM.verticalScrollPolicy = "off";
         this.dCAM.visible = true;
         try
         {
            this.dCAM["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_viewcuts_tools_Layer1_0() : *
      {
         try
         {
            this.viewcuts["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.viewcuts.enabled = true;
         this.viewcuts.label = "view cuts";
         this.viewcuts.labelPlacement = "right";
         this.viewcuts.selected = false;
         this.viewcuts.visible = true;
         try
         {
            this.viewcuts["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_snap_tools_Layer1_0() : *
      {
         try
         {
            this.snap["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.snap.enabled = true;
         this.snap.label = "snap";
         this.snap.labelPlacement = "right";
         this.snap.selected = false;
         this.snap.visible = true;
         try
         {
            this.snap["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dToolpaths_tools_Layer1_0() : *
      {
         var itemObj5:SimpleCollectionItem = null;
         var collProps5:Array = null;
         var collProp5:Object = null;
         var i5:int = 0;
         var j5:* = undefined;
         try
         {
            this.dToolpaths["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dToolpaths.allowMultipleSelection = false;
         var collObj5:DataProvider = new DataProvider();
         collProps5 = [];
         for(i5 = 0; i5 < collProps5.length; i5++)
         {
            itemObj5 = new SimpleCollectionItem();
            collProp5 = collProps5[i5];
            for(j5 in collProp5)
            {
               itemObj5[j5] = collProp5[j5];
            }
            collObj5.addItem(itemObj5);
         }
         this.dToolpaths.dataProvider = collObj5;
         this.dToolpaths.enabled = true;
         this.dToolpaths.horizontalLineScrollSize = 4;
         this.dToolpaths.horizontalPageScrollSize = 0;
         this.dToolpaths.horizontalScrollPolicy = "auto";
         this.dToolpaths.verticalLineScrollSize = 4;
         this.dToolpaths.verticalPageScrollSize = 0;
         this.dToolpaths.verticalScrollPolicy = "off";
         this.dToolpaths.visible = true;
         try
         {
            this.dToolpaths["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
      
      internal function __setProp_dNesting_tools_Layer1_0() : *
      {
         var itemObj6:SimpleCollectionItem = null;
         var collProps6:Array = null;
         var collProp6:Object = null;
         var i6:int = 0;
         var j6:* = undefined;
         try
         {
            this.dNesting["componentInspectorSetting"] = true;
         }
         catch(e:Error)
         {
         }
         this.dNesting.allowMultipleSelection = false;
         var collObj6:DataProvider = new DataProvider();
         collProps6 = [{
            "label":"set selected as material",
            "data":0
         },{
            "label":"begin nest",
            "data":1
         }];
         for(i6 = 0; i6 < collProps6.length; i6++)
         {
            itemObj6 = new SimpleCollectionItem();
            collProp6 = collProps6[i6];
            for(j6 in collProp6)
            {
               itemObj6[j6] = collProp6[j6];
            }
            collObj6.addItem(itemObj6);
         }
         this.dNesting.dataProvider = collObj6;
         this.dNesting.enabled = true;
         this.dNesting.horizontalLineScrollSize = 4;
         this.dNesting.horizontalPageScrollSize = 0;
         this.dNesting.horizontalScrollPolicy = "auto";
         this.dNesting.verticalLineScrollSize = 4;
         this.dNesting.verticalPageScrollSize = 0;
         this.dNesting.verticalScrollPolicy = "off";
         this.dNesting.visible = true;
         try
         {
            this.dNesting["componentInspectorSetting"] = false;
         }
         catch(e:Error)
         {
         }
      }
   }
}

