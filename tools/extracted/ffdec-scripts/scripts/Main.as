package
{
   import com.lorentz.SVG.*;
   import com.partkart.*;
   import fl.controls.ComboBox;
   import fl.events.ListEvent;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.Matrix;
   import flash.geom.Point;
   import flash.net.FileReference;
   import flash.text.*;
   import flash.ui.Mouse;
   import flash.ui.MouseCursor;
   import flash.utils.Timer;
   
   [SWF(width="950", height="600", backgroundColor="#ffffff", frameRate="30")]
   public class Main extends Sprite
   {
      
      public var tools:MovieClip;
      
      private var grid:Grid;
      
      public var scene:SceneGraph;
      
      private var background:Sprite;
      
      private var backgroundscale:Number = 72;
      
      private var backgroundvisibility:Number = 50;
      
      public var xstart:Number = 0;
      
      public var ystart:Number = 0;
      
      private var dragging:Boolean = false;
      
      private var xoriginstart:Number;
      
      private var yoriginstart:Number;
      
      private var sketch:Sketch;
      
      private var sketchdot:Dot;
      
      private var pen:Pen;
      
      private var pendot:Dot;
      
      private var imposter:Sprite;
      
      private var zooming:Boolean = false;
      
      private var startzoom:Number;
      
      private var now:int = 0;
      
      private var timer:Timer;
      
      private var temptool:int = 0;
      
      private var file:FileReference;
      
      private var progressdialog:ProgressDialog;
      
      private var partkart:PartKart;
      
      public function Main()
      {
         super();
         this.partkart = new PartKart(this);
         stage.align = StageAlign.TOP_LEFT;
         stage.scaleMode = StageScaleMode.NO_SCALE;
         stage.addEventListener(Event.RESIZE,this.stageResize);
         this.background = new Sprite();
         addChild(this.background);
         this.grid = new Grid();
         addChild(this.grid);
         this.scene = SceneGraph.getInstance();
         addChild(this.scene);
         addChild(this.tools);
         this.attachToolsListeners();
         addEventListener(MouseEvent.MOUSE_DOWN,this.mainMouseDown);
         addEventListener(MouseEvent.MOUSE_UP,this.mainMouseUp);
         stage.addEventListener(Event.MOUSE_LEAVE,this.mainMouseLeave);
         this.stage.addEventListener(KeyboardEvent.KEY_DOWN,this.mainKeyDown);
         this.stage.addEventListener(KeyboardEvent.KEY_UP,this.mainKeyUp);
         stage.dispatchEvent(new Event(Event.RESIZE));
         this.scene.redraw();
      }
      
      public function stageResize(e:Event) : *
      {
         if(stage.stageWidth > 400)
         {
            this.tools.background.width = stage.stageWidth;
            this.tools.viewcuts.x = stage.stageWidth - 254;
            this.tools.snap.x = stage.stageWidth - 173;
            this.tools.unit.x = stage.stageWidth - 111;
            this.tools.zoomin.x = stage.stageWidth - 53;
            this.tools.zoomout.x = stage.stageWidth - 29;
         }
         Global.yorigin += stage.stageHeight - Global.docheight;
         Global.docwidth = stage.stageWidth;
         Global.docheight = stage.stageHeight;
         this.grid.clear();
         this.grid.init();
         this.scene.redraw();
      }
      
      public function mainMouseDown(e:MouseEvent) : void
      {
         if(getChildByName("selectarea"))
         {
            removeChild(getChildByName("selectarea"));
         }
         if(Global.tool != 99)
         {
            this.scene.clearDots();
            this.clearMenu();
            this.tools.active = false;
            stage.focus = null;
         }
         if(Global.space == true && Global.tool != 99)
         {
            this.mainStartDrag(e);
         }
         else
         {
            switch(Global.tool)
            {
               case 0:
                  this.mainStartSelect(e);
                  break;
               case 2:
                  this.mainStartDrag(e);
                  break;
               case 1:
                  this.startSketch(e);
                  break;
               case 4:
                  this.startPen(e);
            }
         }
      }
      
      public function mainStartDrag(e:MouseEvent) : void
      {
         addChild(this.tools);
         this.xstart = e.stageX;
         this.ystart = e.stageY;
         this.xoriginstart = Global.xorigin;
         this.yoriginstart = Global.yorigin;
         this.dragging = true;
         Global.dragging = true;
         addEventListener(MouseEvent.MOUSE_MOVE,this.mainDrag);
      }
      
      public function mainDrag(e:MouseEvent) : void
      {
         var xdelta:Number = NaN;
         var ydelta:Number = NaN;
         var selectbox:Sprite = null;
         var b:Shape = null;
         var xs:Number = NaN;
         var ys:Number = NaN;
         var w:Number = NaN;
         var h:Number = NaN;
         if(this.dragging && (Global.tool == 2 || Global.space == true) && Global.tool != 99)
         {
            xdelta = e.stageX - this.xstart;
            ydelta = e.stageY - this.ystart;
            Global.xorigin = this.xoriginstart + xdelta;
            Global.yorigin = this.yoriginstart + ydelta;
            this.grid.setOrigin();
            this.redrawBackground();
            this.scene.x = Global.xorigin;
            this.scene.y = Global.yorigin;
         }
         else if(this.dragging && Global.tool == 0)
         {
            selectbox = getChildByName("selectarea") as Sprite;
            if(selectbox != null)
            {
               b = selectbox.getChildAt(0) as Shape;
               if(e.stageX > this.xstart)
               {
                  xs = 0;
                  w = e.stageX - this.xstart;
               }
               else
               {
                  xs = e.stageX - this.xstart;
                  w = this.xstart - e.stageX;
               }
               if(e.stageY > this.ystart)
               {
                  ys = 0;
                  h = e.stageY - this.ystart;
               }
               else
               {
                  ys = e.stageY - this.ystart;
                  h = this.ystart - e.stageY;
               }
               b.x = xs;
               b.y = ys;
               b.width = w;
               b.height = h;
            }
         }
      }
      
      public function mainMouseUp(e:MouseEvent) : void
      {
         removeEventListener(MouseEvent.MOUSE_MOVE,this.mainDrag);
         if(Global.dragging && Global.tool == 0 && !Global.space)
         {
            this.mainFinishSelect();
         }
         this.dragging = false;
         Global.dragging = false;
      }
      
      public function mainStartSelect(e:MouseEvent) : void
      {
         addChild(this.tools);
         this.xstart = e.stageX;
         this.ystart = e.stageY;
         this.dragging = true;
         Global.dragging = true;
         addEventListener(MouseEvent.MOUSE_MOVE,this.mainDrag);
         var selectbox:Sprite = new Sprite();
         selectbox.name = "selectarea";
         selectbox.x = e.stageX;
         selectbox.y = e.stageY;
         var box:Shape = new Shape();
         box.graphics.beginFill(12379390);
         box.graphics.drawRect(0,0,1,1);
         box.graphics.endFill();
         box.alpha = 0.5;
         selectbox.addChild(box);
         addChild(selectbox);
         this.scene.cacheAsBitmap = false;
         this.scene.mouseChildren = false;
      }
      
      public function mainFinishSelect() : void
      {
         if(!this.scene.ctrl)
         {
            this.scene.setInactive();
         }
         var selectbox:Sprite = getChildByName("selectarea") as Sprite;
         if(selectbox != null && selectbox.width > 1 && selectbox.height > 1)
         {
            this.scene.addChild(selectbox);
            selectbox.x -= this.scene.x;
            selectbox.y -= this.scene.y;
            this.scene.select(selectbox);
            this.scene.removeChild(selectbox);
         }
         this.scene.cacheAsBitmap = true;
         this.scene.mouseChildren = true;
      }
      
      public function mainMouseLeave(e:Event) : void
      {
         if(this.dragging == true)
         {
            this.dragging = false;
            Global.dragging = false;
            removeEventListener(MouseEvent.MOUSE_MOVE,this.mainDrag);
            this.mainFinishSelect();
         }
         this.scene.mouseLeave();
      }
      
      public function mainKeyDown(e:KeyboardEvent) : void
      {
         if(e.ctrlKey || e.shiftKey)
         {
            this.scene.ctrl = true;
         }
         else if(e.keyCode == 32 && Global.space == false)
         {
            Global.space = true;
            Mouse.cursor = MouseCursor.HAND;
            this.scene.clearDots();
         }
         else if(e.keyCode == 46 || e.keyCode == 8)
         {
            if(stage.focus == null)
            {
               this.scene.deleteSelected();
            }
         }
      }
      
      public function mainKeyUp(e:KeyboardEvent) : void
      {
         var p:Point = null;
         if(e.ctrlKey == true && e.keyCode == 67)
         {
            this.scene.startCopy();
         }
         else if(e.ctrlKey == true && e.keyCode == 86)
         {
            p = new Point((this.mouseX - Global.xorigin) / Global.zoom,(-this.mouseY + Global.yorigin) / Global.zoom);
            trace("paste point: ",p);
            this.scene.startPaste(p);
         }
         if(!e.ctrlKey || !e.shiftKey)
         {
            this.scene.ctrl = false;
         }
         if(e.keyCode == 32)
         {
            Global.space = false;
            this.setCursor();
         }
      }
      
      public function attachToolsListeners() : void
      {
         this.tools.addEventListener(MouseEvent.MOUSE_OVER,this.toolsOver);
         this.tools.addEventListener(MouseEvent.MOUSE_DOWN,this.toolsDown);
         this.tools.addEventListener(MouseEvent.MOUSE_MOVE,this.toolsMove);
         this.tools.addEventListener(MouseEvent.MOUSE_UP,this.toolsUp);
         this.tools.addEventListener(MouseEvent.MOUSE_OUT,this.toolsOut);
         this.tools.tool0.addEventListener(MouseEvent.MOUSE_OVER,this.toolOver);
         this.tools.tool1.addEventListener(MouseEvent.MOUSE_OVER,this.toolOver);
         this.tools.tool2.addEventListener(MouseEvent.MOUSE_OVER,this.toolOver);
         this.tools.tool3.addEventListener(MouseEvent.MOUSE_OVER,this.toolOver);
         this.tools.tool4.addEventListener(MouseEvent.MOUSE_OVER,this.toolOver);
         this.tools.tool0.addEventListener(MouseEvent.MOUSE_DOWN,this.toolDown);
         this.tools.tool1.addEventListener(MouseEvent.MOUSE_DOWN,this.toolDown);
         this.tools.tool2.addEventListener(MouseEvent.MOUSE_DOWN,this.toolDown);
         this.tools.tool3.addEventListener(MouseEvent.MOUSE_DOWN,this.toolDown);
         this.tools.tool4.addEventListener(MouseEvent.MOUSE_DOWN,this.toolDown);
         this.tools.tool0.addEventListener(MouseEvent.MOUSE_OUT,this.toolOut);
         this.tools.tool1.addEventListener(MouseEvent.MOUSE_OUT,this.toolOut);
         this.tools.tool2.addEventListener(MouseEvent.MOUSE_OUT,this.toolOut);
         this.tools.tool3.addEventListener(MouseEvent.MOUSE_OUT,this.toolOut);
         this.tools.tool4.addEventListener(MouseEvent.MOUSE_OUT,this.toolOut);
         this.tools.zoomin.addEventListener(MouseEvent.CLICK,this.zoomIn);
         this.tools.zoomout.addEventListener(MouseEvent.CLICK,this.zoomOut);
         stage.addEventListener(MouseEvent.MOUSE_WHEEL,this.zoomWheel);
         this.tools.unit.addEventListener(Event.CHANGE,this.unitChange);
         this.tools.snap.addEventListener(Event.CHANGE,this.snapChange);
         this.tools.viewcuts.addEventListener(Event.CHANGE,this.viewcutsChange);
         this.tools.active = false;
         this.tools.mFile.mouseChildren = false;
         this.tools.mEdit.mouseChildren = false;
         this.tools.mInsert.mouseChildren = false;
         this.tools.mCAM.mouseChildren = false;
         this.tools.mToolpaths.mouseChildren = false;
         this.tools.mNesting.mouseChildren = false;
         this.tools.dFile.visible = false;
         this.tools.dEdit.visible = false;
         this.tools.dInsert.visible = false;
         this.tools.dCAM.visible = false;
         this.tools.dToolpaths.visible = false;
         this.tools.dNesting.visible = false;
         this.tools.dFile.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dEdit.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dInsert.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dCAM.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dToolpaths.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dNesting.addEventListener(Event.CHANGE,this.menuSelect);
         this.tools.dToolpaths.addEventListener(ListEvent.ITEM_ROLL_OVER,this.toolpathOver);
         this.tools.mFile.drop = this.tools.dFile;
         this.tools.mEdit.drop = this.tools.dEdit;
         this.tools.mInsert.drop = this.tools.dInsert;
         this.tools.mCAM.drop = this.tools.dCAM;
         this.tools.mToolpaths.drop = this.tools.dToolpaths;
         this.tools.mNesting.drop = this.tools.dNesting;
         this.tools.mFile.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mEdit.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mInsert.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mCAM.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mToolpaths.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mNesting.addEventListener(MouseEvent.ROLL_OVER,this.menuOver);
         this.tools.mFile.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mEdit.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mInsert.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mCAM.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mToolpaths.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mNesting.addEventListener(MouseEvent.ROLL_OUT,this.menuOut);
         this.tools.mFile.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
         this.tools.mEdit.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
         this.tools.mInsert.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
         this.tools.mCAM.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
         this.tools.mToolpaths.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
         this.tools.mNesting.addEventListener(MouseEvent.MOUSE_DOWN,this.menuDown);
      }
      
      public function clearMenu() : void
      {
         this.tools.mFile.highlightDown.alpha = 0;
         this.tools.mEdit.highlightDown.alpha = 0;
         this.tools.mInsert.highlightDown.alpha = 0;
         this.tools.mCAM.highlightDown.alpha = 0;
         this.tools.mToolpaths.highlightDown.alpha = 0;
         this.tools.mNesting.highlightDown.alpha = 0;
         this.tools.mFile.highlightUp.alpha = 0;
         this.tools.mEdit.highlightUp.alpha = 0;
         this.tools.mInsert.highlightUp.alpha = 0;
         this.tools.mCAM.highlightUp.alpha = 0;
         this.tools.mToolpaths.highlightUp.alpha = 0;
         this.tools.mNesting.highlightUp.alpha = 0;
         this.tools.mFile.text.textColor = 0;
         this.tools.mEdit.text.textColor = 0;
         this.tools.mInsert.text.textColor = 0;
         this.tools.mCAM.text.textColor = 0;
         this.tools.mToolpaths.text.textColor = 0;
         this.tools.mNesting.text.textColor = 0;
         this.tools.dFile.visible = false;
         this.tools.dEdit.visible = false;
         this.tools.dInsert.visible = false;
         this.tools.dCAM.visible = false;
         this.tools.dToolpaths.visible = false;
         this.tools.dNesting.visible = false;
         this.tools.dFile.clearSelection();
         this.tools.dEdit.clearSelection();
         this.tools.dInsert.clearSelection();
         this.tools.dCAM.clearSelection();
         this.tools.dToolpaths.clearSelection();
         this.tools.dNesting.clearSelection();
      }
      
      public function toolsOver(e:MouseEvent) : void
      {
         Mouse.cursor = MouseCursor.AUTO;
      }
      
      public function toolsDown(e:MouseEvent) : void
      {
         e.stopPropagation();
         addChild(this.tools);
      }
      
      public function toolsMove(e:MouseEvent) : void
      {
         e.stopPropagation();
      }
      
      public function toolsUp(e:MouseEvent) : void
      {
      }
      
      public function toolsOut(e:MouseEvent) : void
      {
         this.setCursor();
      }
      
      public function toolOver(e:MouseEvent) : void
      {
         e.target.alpha = 0.5;
      }
      
      public function toolDown(e:MouseEvent) : void
      {
         e.target.alpha = 1;
         if(Global.tool == 4 && e.target.name != "tool4")
         {
            if(this.pen != null)
            {
               this.pen.graphics.clear();
               this.pen = null;
               removeEventListener(MouseEvent.MOUSE_MOVE,this.movePen);
               removeEventListener(MouseEvent.MOUSE_UP,this.upPen);
            }
         }
         if(e.target.name == "tool0")
         {
            Global.tool = 0;
            this.scene.clearDots();
            this.setZoom(Global.zoom);
         }
         else if(e.target.name == "tool1")
         {
            Global.tool = 1;
            this.scene.addDots();
            this.setZoom(Global.zoom);
         }
         else if(e.target.name == "tool2")
         {
            Global.tool = 2;
            this.scene.clearDots();
            this.setZoom(Global.zoom);
         }
         else if(e.target.name == "tool3")
         {
            Global.tool = 3;
            this.scene.addDots();
            this.setZoom(Global.zoom);
         }
         else if(e.target.name == "tool4")
         {
            Global.tool = 4;
            this.scene.clearDots();
            this.setZoom(Global.zoom);
         }
         this.setCursor();
      }
      
      public function toolOut(e:MouseEvent) : void
      {
         e.target.alpha = 1;
      }
      
      public function menuOver(e:MouseEvent) : void
      {
         var t:TextField = null;
         if(this.tools.active == false)
         {
            e.target.getChildByName("highlightUp").alpha = 0.15;
         }
         else if(e.target)
         {
            this.clearMenu();
            e.target.getChildByName("highlightDown").alpha = 1;
            t = e.target.getChildByName("text") as TextField;
            t.textColor = 16777215;
            if(e.target.drop)
            {
               e.target.drop.visible = true;
            }
         }
      }
      
      public function menuOut(e:MouseEvent) : void
      {
         var t:TextField = null;
         if(this.tools.active == false)
         {
            e.target.getChildByName("highlightUp").alpha = 0;
            t = e.target.getChildByName("text") as TextField;
            t.textColor = 0;
         }
      }
      
      public function toolpathOver(e:ListEvent) : void
      {
         var cut:CutObject = null;
         for each(cut in this.scene.cutlist)
         {
            cut.setInactive();
         }
         e.item.data.setActive();
         stage.focus = null;
      }
      
      public function menuDown(e:MouseEvent) : void
      {
         var t:TextField = e.target.getChildByName("text") as TextField;
         if(this.tools.active == true)
         {
            this.tools.active = false;
            this.clearMenu();
         }
         else
         {
            this.tools.active = true;
            this.clearMenu();
            e.target.getChildByName("highlightDown").alpha = 1;
            if(e.target.drop)
            {
               e.target.drop.visible = true;
            }
            t.textColor = 16777215;
         }
      }
      
      public function menuSelect(e:Event) : void
      {
         var selected:Boolean = false;
         var p:Path = null;
         var closed:Boolean = false;
         var unit:String = null;
         var safetyheight:Number = NaN;
         var stocksurface:String = null;
         var targetdepth:Number = NaN;
         var stepdown:Number = NaN;
         var stepover:Number = NaN;
         var feedrate:Number = NaN;
         var plungerate:Number = NaN;
         var tooldiameter:Number = NaN;
         var roughingclearance:String = null;
         var dir:int = 0;
         var valid:Boolean = false;
         var pd:ProgressDialog = null;
         var pd1:ProgressDialog = null;
         var activecuts:Array = null;
         var center:Boolean = false;
         var spacing:Number = NaN;
         var outside:Boolean = false;
         var processed:Array = null;
         var fields:Array = null;
         var cutobject:CutObject = null;
         var cut:CutObject = null;
         var selectedindex:int = 0;
         var profile:ProfileCutObject = null;
         var pocket:PocketCutObject = null;
         var follow:FollowPathCutObject = null;
         var drill:DrillCutObject = null;
         var selectedpaths:Array = null;
         var path:Path = null;
         if(e.target == this.tools.dFile)
         {
            switch(e.target.selectedIndex)
            {
               case 0:
                  trace("import!");
                  this.loadFile();
                  break;
               case 1:
                  trace("export!");
                  this.saveFile();
            }
         }
         else if(e.target == this.tools.dEdit)
         {
            switch(e.target.selectedIndex)
            {
               case 0:
                  Global.undoAction();
                  this.scene.redraw();
                  break;
               case 1:
                  Global.redoAction();
                  this.scene.redraw();
                  break;
               case 2:
                  this.scene.startCopy();
                  break;
               case 3:
                  this.scene.startPaste();
                  break;
               case 4:
                  this.startDialog(120,100,new Array({
                     "type":"number",
                     "label":"Scale X (%)",
                     "value":100
                  },{
                     "type":"number",
                     "label":"Scale Y (%)",
                     "value":100
                  }),"scale");
                  break;
               case 5:
                  this.startDialog(120,50,new Array({
                     "type":"number",
                     "label":"Rotate (degrees)",
                     "value":"0"
                  }),"rotate");
                  break;
               case 6:
                  this.startDialog(120,100,new Array({
                     "type":"number",
                     "label":"Skew X (%)",
                     "value":"0"
                  },{
                     "type":"number",
                     "label":"Skew Y (%)",
                     "value":"0"
                  }),"skew");
                  break;
               case 7:
                  this.scene.separateSelected();
                  break;
               case 8:
                  this.startDialog(200,100,new Array({
                     "type":"file",
                     "label":"Load Image From Disk"
                  },{
                     "type":"number",
                     "label":"Image Resolution (px/" + Global.unit + ")",
                     "value":this.backgroundscale
                  },{
                     "type":"number",
                     "label":"Visibility (%)",
                     "value":String(this.backgroundvisibility)
                  }),"background");
                  break;
               case 9:
                  this.startDialog(250,150,new Array({
                     "type":"number",
                     "label":"SVG Import Default Resolution (px/inch)",
                     "value":Global.importres
                  },{
                     "type":"label",
                     "label":"Common values:"
                  },{
                     "type":"label",
                     "label":"Illustrator: 72, Inkscape: 90"
                  },{
                     "type":"label",
                     "label":""
                  },{
                     "type":"checkbox",
                     "label":"Snap to local points",
                     "value":Global.localsnap
                  },{
                     "type":"label",
                     "label":""
                  },{
                     "type":"number",
                     "label":"Machining Tolerance (" + Global.unit + ")",
                     "value":Global.tolerance
                  },{
                     "type":"number",
                     "label":"Bitmap Tolerance",
                     "value":Global.bitmaptolerance
                  },{
                     "type":"number",
                     "label":"Bitmap Size",
                     "value":Global.bitmapsize
                  },{
                     "type":"number",
                     "label":"Nesting Bitmap Size",
                     "value":Global.nestbitmapsize
                  },{
                     "type":"checkbox",
                     "label":"Separate Toolpaths by Boundary",
                     "value":Global.separatetoolpaths
                  }),"preferences");
            }
         }
         else if(e.target == this.tools.dInsert)
         {
            switch(e.target.selectedIndex)
            {
               case 0:
                  this.startDialog(120,50,new Array({
                     "type":"number",
                     "label":"Diameter (" + Global.unit + ")",
                     "value":1
                  }),"addcircle");
                  break;
               case 1:
                  this.startDialog(120,100,new Array({
                     "type":"number",
                     "label":"Ellipse Width (" + Global.unit + ")",
                     "value":1
                  },{
                     "type":"number",
                     "label":"Ellipse Height (" + Global.unit + ")",
                     "value":1
                  }),"addellipse");
                  break;
               case 2:
                  this.startDialog(150,100,new Array({
                     "type":"number",
                     "label":"Rectangle Width (" + Global.unit + ")",
                     "value":1
                  },{
                     "type":"number",
                     "label":"Rectangle Height (" + Global.unit + ")",
                     "value":1
                  }),"addrectangle");
                  break;
               case 3:
                  this.startDialog(150,100,new Array({
                     "type":"number",
                     "label":"Rectangle Width (" + Global.unit + ")",
                     "value":1
                  },{
                     "type":"number",
                     "label":"Rectangle Height (" + Global.unit + ")",
                     "value":1
                  },{
                     "type":"number",
                     "label":"Corner Radius (" + Global.unit + ")",
                     "value":0.2
                  }),"addroundedrectangle");
                  break;
               case 4:
                  this.startDialog(120,100,new Array({
                     "type":"number",
                     "label":"Number of Sides",
                     "value":6
                  },{
                     "type":"number",
                     "label":"Radius (" + Global.unit + ")",
                     "value":1
                  }),"addpolygon");
                  break;
               case 5:
                  this.startDialog(120,100,new Array({
                     "type":"number",
                     "label":"Number of Points",
                     "value":6
                  },{
                     "type":"number",
                     "label":"Radius (" + Global.unit + ")",
                     "value":1
                  },{
                     "type":"number",
                     "label":"Pointiness (%)",
                     "value":50
                  }),"addstar");
            }
         }
         else if(e.target == this.tools.dCAM)
         {
            safetyheight = Global.unit == "in" ? 0.5 : 15;
            stocksurface = "0";
            targetdepth = Global.unit == "in" ? -0.75 : -10;
            stepdown = Global.unit == "in" ? 0.05 : 1.5;
            stepover = 40;
            feedrate = Global.unit == "in" ? 60 : 1500;
            plungerate = Global.unit == "in" ? 30 : 800;
            tooldiameter = Global.unit == "in" ? 0.25 : 5;
            roughingclearance = "0";
            dir = 1;
            switch(e.target.selectedIndex)
            {
               case 0:
                  selected = false;
                  for each(p in this.scene.pathlist)
                  {
                     closed = p.isClosed();
                     if(p.active == true && closed)
                     {
                        selected = true;
                     }
                     else if(p.active == true && !closed)
                     {
                        p.setInactive();
                     }
                  }
                  if(selected == false)
                  {
                     this.startDialog(240,50,new Array({
                        "type":"label",
                        "label":"Please select at least one closed path"
                     }),"error");
                  }
                  else
                  {
                     unit = Global.unit == "in" ? "in" : "mm";
                     this.startDialog(150,200,new Array({
                        "type":"string",
                        "label":"name",
                        "value":"profile " + (this.scene.cutlist.length + 1)
                     },{
                        "type":"number",
                        "label":"tool diameter (" + unit + ")",
                        "value":tooldiameter,
                        "highlight":true
                     },{
                        "type":"number",
                        "label":"target depth (" + unit + ")",
                        "value":targetdepth,
                        "highlight":true
                     },{
                        "type":"combobox",
                        "label":"inside/outside",
                        "items":new Array({
                           "label":"Outside",
                           "data":true
                        },{
                           "label":"Inside",
                           "data":false
                        })
                     },{
                        "type":"number",
                        "label":"safety height (" + unit + ")",
                        "value":safetyheight
                     },{
                        "type":"number",
                        "label":"stock surface (" + unit + ")",
                        "value":stocksurface
                     },{
                        "type":"number",
                        "label":"step down (" + unit + ")",
                        "value":stepdown
                     },{
                        "type":"number",
                        "label":"feed rate (" + unit + "/minute)",
                        "value":feedrate
                     },{
                        "type":"number",
                        "label":"plunge rate (" + unit + "/minute)",
                        "value":plungerate
                     },{
                        "type":"combobox",
                        "label":"direction",
                        "items":new Array({
                           "label":"Counter Clockwise",
                           "data":1
                        },{
                           "label":"Clockwise",
                           "data":2
                        })
                     }),"profile");
                  }
                  break;
               case 1:
                  selected = false;
                  for each(p in this.scene.pathlist)
                  {
                     closed = p.isClosed();
                     if(p.active == true && closed)
                     {
                        selected = true;
                     }
                     else if(p.active == true && !closed)
                     {
                        p.setInactive();
                     }
                  }
                  if(selected == false)
                  {
                     this.startDialog(240,50,new Array({
                        "type":"label",
                        "label":"Please select at least one closed path"
                     }),"error");
                  }
                  else
                  {
                     unit = Global.unit == "in" ? "in" : "mm";
                     this.startDialog(150,200,new Array({
                        "type":"string",
                        "label":"name",
                        "value":"pocket " + (this.scene.cutlist.length + 1)
                     },{
                        "type":"number",
                        "label":"tool diameter (" + unit + ")",
                        "value":tooldiameter,
                        "highlight":true
                     },{
                        "type":"number",
                        "label":"target depth (" + unit + ")",
                        "value":targetdepth,
                        "highlight":true
                     },{
                        "type":"number",
                        "label":"safety height (" + unit + ")",
                        "value":safetyheight
                     },{
                        "type":"number",
                        "label":"stock surface (" + unit + ")",
                        "value":stocksurface
                     },{
                        "type":"number",
                        "label":"step over (%)",
                        "value":stepover
                     },{
                        "type":"number",
                        "label":"step down (" + unit + ")",
                        "value":stepdown
                     },{
                        "type":"number",
                        "label":"roughing clearance (" + unit + ")",
                        "value":roughingclearance
                     },{
                        "type":"number",
                        "label":"feedrate (" + unit + "/minute)",
                        "value":feedrate
                     },{
                        "type":"number",
                        "label":"plunge rate (" + unit + "/minute)",
                        "value":plungerate
                     },{
                        "type":"combobox",
                        "label":"direction",
                        "items":new Array({
                           "label":"Counter Clockwise",
                           "data":1
                        },{
                           "label":"Clockwise",
                           "data":2
                        })
                     }),"pocket");
                  }
                  break;
               case 2:
                  selected = false;
                  for each(p in this.scene.pathlist)
                  {
                     if(p.active == true)
                     {
                        selected = true;
                     }
                  }
                  if(selected == false)
                  {
                     this.startDialog(230,50,new Array({
                        "type":"label",
                        "label":"Please select at least one path"
                     }),"error");
                  }
                  else
                  {
                     unit = Global.unit == "in" ? "in" : "mm";
                     this.startDialog(150,200,new Array({
                        "type":"string",
                        "label":"name",
                        "value":"follow path " + (this.scene.cutlist.length + 1)
                     },{
                        "type":"number",
                        "label":"tool diameter (" + unit + ")",
                        "value":tooldiameter,
                        "highlight":true
                     },{
                        "type":"number",
                        "label":"target depth (" + unit + ")",
                        "value":targetdepth,
                        "highlight":true
                     },{
                        "type":"number",
                        "label":"safety height (" + unit + ")",
                        "value":safetyheight
                     },{
                        "type":"number",
                        "label":"stock surface (" + unit + ")",
                        "value":stocksurface
                     },{
                        "type":"number",
                        "label":"step down (" + unit + ")",
                        "value":stepdown
                     },{
                        "type":"number",
                        "label":"feedrate (" + unit + "/minute)",
                        "value":feedrate
                     },{
                        "type":"number",
                        "label":"plunge rate (" + unit + "/minute)",
                        "value":plungerate
                     }),"followpath");
                  }
                  break;
               case 3:
                  unit = Global.unit == "in" ? "in" : "mm";
                  this.startDialog(150,200,new Array({
                     "type":"string",
                     "label":"name",
                     "value":"drill " + (this.scene.cutlist.length + 1)
                  },{
                     "type":"number",
                     "label":"tool diameter (" + unit + ")",
                     "value":tooldiameter,
                     "highlight":true
                  },{
                     "type":"number",
                     "label":"target depth (" + unit + ")",
                     "value":targetdepth,
                     "highlight":true
                  },{
                     "type":"combobox",
                     "label":"drill location",
                     "items":new Array({
                        "label":"path center",
                        "data":true
                     },{
                        "label":"fill pattern",
                        "data":false
                     }),
                     "value":true,
                     "highlight":true
                  },{
                     "type":"number",
                     "label":"hole spacing (" + unit + ")",
                     "value":tooldiameter * 2,
                     "highlight":true
                  },{
                     "type":"number",
                     "label":"safety height (" + unit + ")",
                     "value":safetyheight
                  },{
                     "type":"number",
                     "label":"stock surface (" + unit + ")",
                     "value":stocksurface
                  },{
                     "type":"number",
                     "label":"peck distance (" + unit + ")",
                     "value":stepdown
                  },{
                     "type":"number",
                     "label":"plunge rate (" + unit + "/minute)",
                     "value":plungerate
                  }),"drill");
                  break;
               case 4:
                  valid = false;
                  for each(cutobject in this.scene.cutlist)
                  {
                     if(cutobject is ProfileCutObject && cutobject.processed == true)
                     {
                        valid = true;
                        break;
                     }
                  }
                  if(!valid)
                  {
                     this.startDialog(320,50,new Array({
                        "type":"label",
                        "label":"Please select at least one calculated profile operation"
                     }),"error");
                     return;
                  }
                  this.startDialog(150,200,new Array({
                     "type":"number",
                     "label":"tab spacing (" + Global.unit + ")",
                     "value":(Global.unit == "in" ? 5 : 15)
                  },{
                     "type":"number",
                     "label":"tab width (" + Global.unit + ")",
                     "value":(Global.unit == "in" ? 0.25 : 0.5)
                  },{
                     "type":"number",
                     "label":"tab height (" + Global.unit + ")",
                     "value":(Global.unit == "in" ? 0.25 : 0.5)
                  }),"tabs");
                  break;
               case 5:
                  pd = this.startProgressDialog(250,75,"processing","Cancel",this.scene.cutCancel);
                  this.scene.reprocessCuts(pd);
                  break;
               case 6:
                  pd1 = this.startProgressDialog(250,75,"processing","Cancel",this.scene.cutCancel);
                  this.scene.reprocessCuts(pd1,true);
                  break;
               case 7:
                  unit = Global.unit == "in" ? "in" : "mm";
                  activecuts = this.scene.getActiveCuts();
                  center = true;
                  spacing = tooldiameter * 2;
                  outside = true;
                  for each(cut in activecuts)
                  {
                     if(!isNaN(cut.tooldiameter))
                     {
                        tooldiameter = cut.tooldiameter;
                     }
                     if(!isNaN(cut.targetdepth))
                     {
                        targetdepth = cut.targetdepth;
                     }
                     outside = cut.outside;
                     if(!isNaN(cut.safetyheight))
                     {
                        safetyheight = cut.safetyheight;
                     }
                     if(!isNaN(cut.stocksurface))
                     {
                        stocksurface = String(cut.stocksurface);
                     }
                     if(!isNaN(cut.stepover))
                     {
                        stepover = cut.stepover;
                     }
                     if(!isNaN(cut.stepdown))
                     {
                        stepdown = cut.stepdown;
                     }
                     if(!isNaN(cut.roughingclearance))
                     {
                        roughingclearance = String(cut.roughingclearance);
                     }
                     if(!isNaN(cut.feedrate))
                     {
                        feedrate = cut.feedrate;
                     }
                     if(!isNaN(cut.plungerate))
                     {
                        plungerate = cut.plungerate;
                     }
                     if(!isNaN(cut.dir))
                     {
                        dir = cut.dir;
                     }
                     center = cut.center;
                     if(!isNaN(cut.spacing))
                     {
                        spacing = cut.spacing;
                     }
                  }
                  this.startDialog(150,200,new Array({
                     "type":"number",
                     "label":"tool diameter (" + unit + ")",
                     "value":tooldiameter
                  },{
                     "type":"number",
                     "label":"target depth (" + unit + ")",
                     "value":targetdepth
                  },{
                     "type":"combobox",
                     "label":"inside/outside",
                     "items":new Array({
                        "label":"Outside",
                        "data":true
                     },{
                        "label":"Inside",
                        "data":false
                     }),
                     "value":outside
                  },{
                     "type":"number",
                     "label":"safety height (" + unit + ")",
                     "value":safetyheight
                  },{
                     "type":"number",
                     "label":"stock surface (" + unit + ")",
                     "value":stocksurface
                  },{
                     "type":"number",
                     "label":"step over (%)",
                     "value":stepover
                  },{
                     "type":"number",
                     "label":"step down (" + unit + ")",
                     "value":stepdown
                  },{
                     "type":"number",
                     "label":"roughing clearance (" + unit + ")",
                     "value":roughingclearance
                  },{
                     "type":"number",
                     "label":"feedrate (" + unit + "/minute)",
                     "value":feedrate
                  },{
                     "type":"number",
                     "label":"plunge rate (" + unit + "/minute)",
                     "value":plungerate
                  },{
                     "type":"combobox",
                     "label":"direction",
                     "items":new Array({
                        "label":"Counter Clockwise",
                        "data":1
                     },{
                        "label":"Clockwise",
                        "data":2
                     }),
                     "value":dir
                  },{
                     "type":"combobox",
                     "label":"drill location",
                     "items":new Array({
                        "label":"path center",
                        "data":true
                     },{
                        "label":"fill pattern",
                        "data":false
                     }),
                     "value":center,
                     "highlight":true
                  },{
                     "type":"number",
                     "label":"hole spacing (" + unit + ")",
                     "value":spacing
                  }),"batch");
                  break;
               case 8:
                  processed = this.scene.getProcessedCuts();
                  fields = new Array();
                  for each(cut in processed)
                  {
                     fields.push({
                        "label":cut.name + " (" + Global.toFixed(cut.tooldiameter,10 * Math.ceil(1 / Global.tolerance)) + ")",
                        "data":cut,
                        "diameter":cut.tooldiameter,
                        "active":cut.active
                     });
                  }
                  this.startDialog(300,200,new Array({
                     "type":"cutlist",
                     "label":"calculated toolpaths",
                     "value":fields
                  },{
                     "type":"combobox",
                     "label":false,
                     "items":new Array({
                        "label":"Standard G-Code",
                        "data":0
                     }),
                     "value":0
                  }),"exportgcode","Export Selected Toolpaths",false);
            }
         }
         else if(e.target == this.tools.dToolpaths)
         {
            selectedindex = int(this.tools.dToolpaths.selectedIndex);
            unit = Global.unit == "in" ? "in" : "mm";
            if(e.target.selectedItem.data is ProfileCutObject)
            {
               profile = e.target.selectedItem.data as ProfileCutObject;
               this.startDialog(150,200,new Array({
                  "type":"string",
                  "label":"name",
                  "value":profile.name
               },{
                  "type":"number",
                  "label":"tool diameter (" + unit + ")",
                  "value":(unit == "mm" ? 10 * profile.tooldiameter : profile.tooldiameter),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"target depth (" + unit + ")",
                  "value":(profile.targetdepth == 0 ? String(profile.targetdepth) : profile.targetdepth),
                  "highlight":true
               },{
                  "type":"combobox",
                  "label":"inside/outside",
                  "items":new Array({
                     "label":"Outside",
                     "data":true
                  },{
                     "label":"Inside",
                     "data":false
                  }),
                  "value":profile.outside
               },{
                  "type":"number",
                  "label":"safety height (" + unit + ")",
                  "value":(profile.safetyheight == 0 ? String(profile.safetyheight) : profile.safetyheight)
               },{
                  "type":"number",
                  "label":"stock surface (" + unit + ")",
                  "value":(profile.stocksurface == 0 ? String(profile.stocksurface) : profile.stocksurface)
               },{
                  "type":"number",
                  "label":"step down (" + unit + ")",
                  "value":profile.stepdown
               },{
                  "type":"number",
                  "label":"feedrate (" + unit + "/minute)",
                  "value":profile.feedrate
               },{
                  "type":"number",
                  "label":"plunge rate (" + unit + "/minute)",
                  "value":profile.plungerate
               },{
                  "type":"combobox",
                  "label":"direction",
                  "items":new Array({
                     "label":"Counter Clockwise",
                     "data":1
                  },{
                     "label":"Clockwise",
                     "data":2
                  }),
                  "value":profile.dir
               }),"editprofile");
            }
            else if(e.target.selectedItem.data is PocketCutObject)
            {
               pocket = e.target.selectedItem.data as PocketCutObject;
               this.startDialog(150,200,new Array({
                  "type":"string",
                  "label":"name",
                  "value":pocket.name
               },{
                  "type":"number",
                  "label":"tool diameter (" + unit + ")",
                  "value":(unit == "mm" ? 10 * pocket.tooldiameter : pocket.tooldiameter),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"target depth (" + unit + ")",
                  "value":(pocket.targetdepth == 0 ? String(pocket.targetdepth) : pocket.targetdepth),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"safety height (" + unit + ")",
                  "value":(pocket.safetyheight == 0 ? String(pocket.safetyheight) : pocket.safetyheight)
               },{
                  "type":"number",
                  "label":"stock surface (" + unit + ")",
                  "value":(pocket.stocksurface == 0 ? String(pocket.stocksurface) : pocket.stocksurface)
               },{
                  "type":"number",
                  "label":"step over (%)",
                  "value":100 * pocket.stepover
               },{
                  "type":"number",
                  "label":"step down (" + unit + ")",
                  "value":pocket.stepdown
               },{
                  "type":"number",
                  "label":"roughing clearance (" + unit + ")",
                  "value":(pocket.roughingclearance == 0 ? "0" : (unit == "mm" ? 10 * pocket.roughingclearance : pocket.roughingclearance))
               },{
                  "type":"number",
                  "label":"feedrate (" + unit + "/minute)",
                  "value":pocket.feedrate
               },{
                  "type":"number",
                  "label":"plunge rate (" + unit + "/minute)",
                  "value":pocket.plungerate
               },{
                  "type":"combobox",
                  "label":"direction",
                  "items":new Array({
                     "label":"Counter Clockwise",
                     "data":1
                  },{
                     "label":"Clockwise",
                     "data":2
                  }),
                  "value":pocket.dir
               }),"editpocket");
            }
            else if(e.target.selectedItem.data is FollowPathCutObject)
            {
               follow = e.target.selectedItem.data as FollowPathCutObject;
               this.startDialog(150,200,new Array({
                  "type":"string",
                  "label":"name",
                  "value":follow.name
               },{
                  "type":"number",
                  "label":"tool diameter (" + unit + ")",
                  "value":(unit == "mm" ? 10 * follow.tooldiameter : follow.tooldiameter),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"target depth (" + unit + ")",
                  "value":(follow.targetdepth == 0 ? String(follow.targetdepth) : follow.targetdepth),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"safety height (" + unit + ")",
                  "value":(follow.safetyheight == 0 ? String(follow.safetyheight) : follow.safetyheight)
               },{
                  "type":"number",
                  "label":"stock surface (" + unit + ")",
                  "value":(follow.stocksurface == 0 ? String(follow.stocksurface) : follow.stocksurface)
               },{
                  "type":"number",
                  "label":"step down (" + unit + ")",
                  "value":follow.stepdown
               },{
                  "type":"number",
                  "label":"feedrate (" + unit + "/minute)",
                  "value":follow.feedrate
               },{
                  "type":"number",
                  "label":"plunge rate (" + unit + "/minute)",
                  "value":follow.plungerate
               }),"editfollowpath");
            }
            else if(e.target.selectedItem.data is DrillCutObject)
            {
               drill = e.target.selectedItem.data as DrillCutObject;
               this.startDialog(150,200,new Array({
                  "type":"string",
                  "label":"name",
                  "value":drill.name
               },{
                  "type":"number",
                  "label":"tool diameter (" + unit + ")",
                  "value":(unit == "mm" ? 10 * drill.tooldiameter : drill.tooldiameter),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"target depth (" + unit + ")",
                  "value":(drill.targetdepth == 0 ? String(drill.targetdepth) : drill.targetdepth),
                  "highlight":true
               },{
                  "type":"combobox",
                  "label":"drill location",
                  "items":new Array({
                     "label":"path center",
                     "data":true
                  },{
                     "label":"fill pattern",
                     "data":false
                  }),
                  "value":drill.center,
                  "highlight":true
               },{
                  "type":"number",
                  "label":"hole spacing (" + unit + ")",
                  "value":(unit == "mm" ? 10 * drill.spacing : drill.spacing),
                  "highlight":true
               },{
                  "type":"number",
                  "label":"safety height (" + unit + ")",
                  "value":(drill.safetyheight == 0 ? String(drill.safetyheight) : drill.safetyheight)
               },{
                  "type":"number",
                  "label":"stock surface (" + unit + ")",
                  "value":(drill.stocksurface == 0 ? String(drill.stocksurface) : drill.stocksurface)
               },{
                  "type":"number",
                  "label":"peck distance (" + unit + ")",
                  "value":drill.stepdown
               },{
                  "type":"number",
                  "label":"plunge rate (" + unit + "/minute)",
                  "value":drill.plungerate
               }),"editdrill");
            }
         }
         else if(e.target == this.tools.dNesting)
         {
            switch(e.target.selectedIndex)
            {
               case 0:
                  selectedpaths = new Array();
                  for each(path in this.scene.pathlist)
                  {
                     if(path.active == true)
                     {
                        selectedpaths.push(path);
                     }
                  }
                  if(selectedpaths.length != 1)
                  {
                     this.startDialog(375,50,new Array({
                        "type":"label",
                        "label":"Please specify exactly one closed path to act as the material boundary"
                     }),"error");
                  }
                  else if(!selectedpaths[0].isClosed())
                  {
                     this.startDialog(230,50,new Array({
                        "type":"label",
                        "label":"The selected path is not a closed path"
                     }),"error");
                  }
                  else
                  {
                     this.scene.nestpath = selectedpaths[0];
                  }
                  break;
               case 1:
                  if(this.scene.nestpath == null || !this.scene.contains(this.scene.nestpath))
                  {
                     this.startDialog(330,50,new Array({
                        "type":"label",
                        "label":"Please specify a closed path to act as the material boundary"
                     }),"error");
                  }
                  else
                  {
                     this.startDialog(200,100,new Array({
                        "type":"number",
                        "label":"angles",
                        "value":4
                     },{
                        "type":"number",
                        "label":"space between objects (" + Global.unit + ")",
                        "value":"0"
                     },{
                        "type":"checkbox",
                        "label":"group overlapping toolpaths",
                        "value":true
                     },{
                        "type":"checkbox",
                        "label":"group profile operations",
                        "value":false
                     }),"startnest");
                  }
            }
         }
         this.clearMenu();
         this.tools.active = false;
         if(e.target == this.tools.dToolpaths)
         {
            this.tools.dToolpaths.selectedIndex = selectedindex;
         }
      }
      
      public function setCursor() : void
      {
         if(Global.tool == 0 || Global.tool == 3 || Global.tool == 4)
         {
            Mouse.cursor = MouseCursor.AUTO;
         }
         else if(Global.tool == 1)
         {
            Mouse.cursor = MouseCursor.BUTTON;
         }
         else if(Global.tool == 2)
         {
            Mouse.cursor = MouseCursor.HAND;
         }
      }
      
      public function zoomIn(e:MouseEvent) : void
      {
         if(Global.zoom < 200)
         {
            this.setZoom(Global.zoom * 1.2);
         }
      }
      
      public function zoomOut(e:MouseEvent) : void
      {
         if(Global.zoom > 15)
         {
            this.setZoom(Global.zoom * 0.8);
         }
      }
      
      public function zoomWheel(e:MouseEvent) : void
      {
         var d:int = 0;
         if(Global.dragging == false && Global.tool != 99)
         {
            if(this.zooming == false)
            {
               this.zooming = true;
               this.startzoom = Global.zoom;
               this.timer = new Timer(100,1);
               this.timer.addEventListener(TimerEvent.TIMER_COMPLETE,this.finishZoom);
               this.timer.start();
            }
            else if(this.timer)
            {
               this.timer.reset();
               this.timer.start();
            }
            d = e.delta / Math.abs(e.delta);
            if(d < 0)
            {
               if(Global.zoom < 2000)
               {
                  this.imposterZoom(Global.zoom * 1.2,new Point(e.stageX,e.stageY));
               }
            }
            else if(d > 0)
            {
               this.imposterZoom(Global.zoom * 0.8);
            }
         }
      }
      
      public function finishZoom(e:TimerEvent) : void
      {
         this.zooming = false;
         if(this.imposter != null && contains(this.imposter))
         {
            removeChild(this.imposter);
         }
         this.imposter = null;
         this.scene.visible = true;
         this.scene.x = Global.xorigin;
         this.scene.y = Global.yorigin;
         this.scene.redraw();
      }
      
      public function imposterZoom(zoom:Number, mouse:Point = null) : void
      {
         var trans:Matrix = null;
         var b:BitmapData = null;
         var bitmap:Bitmap = null;
         if(zoom != Global.zoom)
         {
            if(this.imposter == null)
            {
               this.imposter = new Sprite();
               trans = new Matrix(1,0,0,1,Global.xorigin + stage.stageWidth / 2,Global.yorigin + stage.stageHeight / 2);
               if(this.scene.width > 0 && this.scene.height > 0)
               {
                  try
                  {
                     b = new BitmapData(stage.stageWidth * 2,stage.stageHeight * 2,true,0);
                     b.draw(this.scene,trans);
                     bitmap = new Bitmap(b,"auto",false);
                     bitmap.x = -Global.xorigin - stage.stageWidth / 2;
                     bitmap.y = -Global.yorigin - stage.stageHeight / 2;
                     this.imposter.addChild(bitmap);
                  }
                  catch(e:Error)
                  {
                     setZoom(zoom,mouse);
                     return;
                  }
               }
               this.scene.visible = false;
            }
            if(mouse == null)
            {
               Global.xorigin = Global.docwidth / 2 - (Global.docwidth / 2 - Global.xorigin) * (zoom / Global.zoom);
               Global.yorigin = Global.docheight / 2 - (Global.docheight / 2 - Global.yorigin) * (zoom / Global.zoom);
            }
            else
            {
               Global.xorigin = mouse.x - (mouse.x - Global.xorigin) * (zoom / Global.zoom);
               Global.yorigin = mouse.y - (mouse.y - Global.yorigin) * (zoom / Global.zoom);
            }
            addChild(this.imposter);
            Global.zoom = zoom;
            this.grid.setOrigin();
            this.grid.redrawGrid();
            this.redrawBackground();
            this.imposter.x = Global.xorigin;
            this.imposter.y = Global.yorigin;
            this.imposter.width = 2 * stage.stageWidth * (Global.zoom / this.startzoom);
            this.imposter.height = 2 * stage.stageHeight * (Global.zoom / this.startzoom);
         }
      }
      
      public function setZoom(zoom:Number, mouse:Point = null) : void
      {
         addChild(this.tools);
         if(zoom != Global.zoom)
         {
            if(mouse == null)
            {
               Global.xorigin = Global.docwidth / 2 - (Global.docwidth / 2 - Global.xorigin) * (zoom / Global.zoom);
               Global.yorigin = Global.docheight / 2 - (Global.docheight / 2 - Global.yorigin) * (zoom / Global.zoom);
            }
            else
            {
               Global.xorigin = mouse.x - (mouse.x - Global.xorigin) * (zoom / Global.zoom);
               Global.yorigin = mouse.y - (mouse.y - Global.yorigin) * (zoom / Global.zoom);
            }
            Global.zoom = zoom;
            this.grid.setOrigin();
            this.grid.redrawGrid();
            this.redrawBackground();
            this.scene.x = Global.xorigin;
            this.scene.y = Global.yorigin;
            this.scene.redraw();
         }
      }
      
      public function redrawBackground() : void
      {
         var loader:Loader = null;
         var bit:Bitmap = null;
         if(this.background.alpha != 0)
         {
            this.background.x = Global.xorigin;
            this.background.y = Global.yorigin;
            if(this.background.numChildren > 0)
            {
               loader = this.background.getChildAt(0) as Loader;
               bit = loader.content as Bitmap;
               if(bit != null)
               {
                  this.background.width = bit.bitmapData.width / this.backgroundscale * Global.zoom;
                  this.background.height = bit.bitmapData.height / this.backgroundscale * Global.zoom;
               }
            }
         }
      }
      
      public function unitChange(e:Event) : void
      {
         var unitbox:ComboBox = e.target as ComboBox;
         var unit:* = unitbox.value;
         var i:int = 0;
         if(Global.unit != unit)
         {
            if(unit == "in")
            {
               this.scene.cmToInch();
               Global.zoom *= 2.54;
            }
            else if(unit == "cm")
            {
               this.scene.inchToCm();
               Global.zoom /= 2.54;
            }
            this.grid.redrawGrid();
            this.scene.redraw();
            Global.unit = unit;
         }
      }
      
      public function snapChange(e:Event) : void
      {
         Global.snap = e.target.selected;
      }
      
      public function viewcutsChange(e:Event) : void
      {
         Global.viewcuts = e.target.selected;
         this.scene.redraw();
      }
      
      public function loadFile() : void
      {
         var sloader:SVGLoader = new SVGLoader(this);
         sloader.load();
      }
      
      public function saveFile() : void
      {
         if(this.scene.pathlist.length == 0)
         {
            this.startDialog(140,50,new Array({
               "type":"label",
               "label":"No paths to save"
            }),"error");
            return;
         }
         var writer:SVGWriter = new SVGWriter(this.scene.pathlist,this.scene.cutlist);
         var save:String = writer.parse();
         this.file = new FileReference();
         this.file.save(save,"partkamdesign.svg");
         this.file.addEventListener(Event.CANCEL,this.saveCancel);
         this.file.addEventListener(Event.SELECT,this.saveBegin);
         this.file.addEventListener(ProgressEvent.PROGRESS,this.saveProgress);
         this.file.addEventListener(Event.COMPLETE,this.saveComplete);
      }
      
      public function exportGcode(cutlist:Array) : void
      {
         var processor:PostProcessor = new PostProcessor(cutlist);
         var gcode:String = processor.process();
         if(gcode != null)
         {
            this.file = new FileReference();
            this.file.save(gcode,"part.nc");
            this.file.addEventListener(Event.CANCEL,this.saveCancel);
            this.file.addEventListener(Event.COMPLETE,this.saveComplete);
         }
      }
      
      public function saveBegin(e:Event) : void
      {
         this.progressdialog = this.startProgressDialog(250,75,"Saving","Cancel",this.saveProgressCancel);
         this.progressdialog.init(1);
      }
      
      public function saveCancel(e:Event) : void
      {
         this.removeFile();
      }
      
      public function saveProgressCancel() : void
      {
         if(this.file != null)
         {
            this.file.cancel();
         }
         this.removeFile();
      }
      
      public function saveProgress(e:ProgressEvent) : void
      {
         this.progressdialog.setProgress(e.bytesLoaded / e.bytesTotal);
      }
      
      public function saveComplete(e:Event) : void
      {
         this.removeFile();
         if(this.progressdialog != null)
         {
            this.progressdialog.stopDialog();
         }
      }
      
      public function removeFile() : void
      {
         if(this.file != null)
         {
            this.file.removeEventListener(Event.CANCEL,this.saveCancel);
            this.file.removeEventListener(Event.SELECT,this.saveBegin);
            this.file.removeEventListener(ProgressEvent.PROGRESS,this.saveProgress);
            this.file.removeEventListener(Event.COMPLETE,this.saveComplete);
         }
         this.file = null;
      }
      
      public function processFile(svg:Object, svgxml:XML, clean:Boolean = true) : void
      {
         var path:Path = null;
         var h:String = null;
         var pd:ProgressDialog = null;
         var parser:SVGToPath = new SVGToPath();
         var list:Array = parser.parse(svg);
         var miny:Number = 0;
         if(svg.height)
         {
            h = svg.height.toString();
            if(h != "100%")
            {
               miny = parser.getUnit(h);
            }
         }
         for each(path in list)
         {
            path.invertY();
         }
         for each(path in list)
         {
            path.docy -= miny;
         }
         this.scene.setInactive();
         this.scene.addPaths(list);
         if(clean)
         {
            pd = this.startProgressDialog(250,75,"Performing File Cleanup","Stop Cleanup");
            this.scene.processFile(pd,svgxml);
         }
         else
         {
            this.scene.loadCuts(svgxml);
         }
      }
      
      public function addScreen() : void
      {
         Mouse.cursor = MouseCursor.AUTO;
         var s:Shape = new Shape();
         s.graphics.beginFill(0);
         s.graphics.drawRect(0,0,Global.docwidth,Global.docheight);
         s.graphics.endFill();
         s.alpha = 0.1;
         var screen:Sprite = new Sprite();
         screen.addChild(s);
         screen.name = "screen";
         addChild(screen);
      }
      
      public function startDialog(dw:int, dh:int, fieldlist:Array, dialogname:String, submitlabel:String = "OK", closewindow:Boolean = true) : Dialog
      {
         this.addScreen();
         var d:Dialog = new Dialog(dw,dh,fieldlist,submitlabel,closewindow);
         d.name = dialogname;
         d.x = Global.docwidth / 2 - d.width / 2;
         d.y = Global.docheight / 2 - d.height / 2;
         this.temptool = Global.tool;
         Global.tool = 99;
         addChild(d);
         return d;
      }
      
      public function startProgressDialog(dw:int, dh:int, dmessage:String = "processing", dlabel:String = "Cancel", callback:Function = null) : ProgressDialog
      {
         this.addScreen();
         var d:ProgressDialog = new ProgressDialog(dw,dh,dmessage,dlabel,callback);
         d.x = Global.docwidth / 2 - dw / 2;
         d.y = Global.docheight / 2 - dh / 2;
         this.temptool = Global.tool;
         Global.tool = 99;
         addChild(d);
         return d;
      }
      
      public function endDialog() : void
      {
         for(var i:int = 0; i < numChildren; i++)
         {
            if(getChildAt(i) is Sprite)
            {
               getChildAt(i).filters = [];
               if(getChildAt(i).name == "screen")
               {
                  removeChildAt(i);
               }
            }
         }
         this.setCursor();
         Global.tool = this.temptool;
      }
      
      public function processDialog(flist:Array, dname:String) : void
      {
         var sx:Number = NaN;
         var sy:Number = NaN;
         var avx:Number = NaN;
         var avy:Number = NaN;
         var m:Matrix = null;
         var ang:Number = NaN;
         var r:Matrix = null;
         var skx:Number = NaN;
         var sky:Number = NaN;
         var s:Matrix = null;
         var scale:Number = NaN;
         var al:Number = NaN;
         var res:Number = NaN;
         var snap:Boolean = false;
         var tolerance:Number = NaN;
         var bitmaptolerance:Number = NaN;
         var bitmapsize:Number = NaN;
         var nestbitmapsize:Number = NaN;
         var dia:Number = NaN;
         var ew:Number = NaN;
         var eh:Number = NaN;
         var rw:Number = NaN;
         var rh:Number = NaN;
         var rw1:Number = NaN;
         var rh1:Number = NaN;
         var rad:Number = NaN;
         var sides:int = 0;
         var rad1:Number = NaN;
         var points:int = 0;
         var rad2:Number = NaN;
         var pointiness:Number = NaN;
         var pd:ProgressDialog = null;
         var divs:int = 0;
         var gap:Number = NaN;
         var group:Boolean = false;
         var groupprofile:Boolean = false;
         var tabspacing:Number = NaN;
         var tabwidth:Number = NaN;
         var tabheight:Number = NaN;
         var cutlist:Array = null;
         var listitems:Array = null;
         var obj:Object = null;
         stage.focus = this;
         var i:int = 0;
         switch(dname)
         {
            case "scale":
               sx = Number(flist[0].input.text);
               sy = Number(flist[1].input.text);
               avx = 0;
               avy = 0;
               m = new Matrix(sx / 100,0,0,sy / 100,avx,avy);
               if(sx != 0 && sy != 0)
               {
                  this.scene.applyMatrixLocal(m);
               }
               break;
            case "rotate":
               ang = Number(flist[0].input.text);
               r = new Matrix();
               r.rotate(ang * Math.PI / 180);
               if(ang != 0 && ang != 360)
               {
                  this.scene.applyMatrixLocal(r);
               }
               break;
            case "skew":
               skx = Number(flist[0].input.text);
               sky = Number(flist[1].input.text);
               s = new Matrix();
               s.c = Math.tan(-1 * skx / 100);
               s.b = Math.tan(-1 * sky / 100);
               this.scene.applyMatrixLocal(s);
               break;
            case "background":
               if(flist[0].input != null && flist[0].input is Loader)
               {
                  while(this.background.numChildren > 0)
                  {
                     this.background.removeChildAt(0);
                  }
                  this.background.addChild(flist[0].input);
               }
               scale = Number(flist[1].input.text);
               if(!isNaN(scale) && scale != 0)
               {
                  if(scale < 0)
                  {
                     scale = Math.abs(scale);
                  }
                  this.backgroundscale = scale;
                  this.redrawBackground();
               }
               al = Number(flist[2].input.text);
               if(!isNaN(al))
               {
                  if(al > 100)
                  {
                     al = 100;
                  }
                  else if(al < 0)
                  {
                     al = Math.abs(al);
                  }
                  this.background.alpha = al / 100;
                  this.backgroundvisibility = al;
               }
               break;
            case "preferences":
               res = Number(flist[0].input.text);
               if(!isNaN(res) && res != 0)
               {
                  if(res < 0)
                  {
                     res = -res;
                  }
                  Global.importres = res;
               }
               snap = Boolean(flist[4].input.selected);
               Global.localsnap = snap;
               tolerance = Number(flist[6].input.text);
               if(!isNaN(tolerance) && tolerance != 0)
               {
                  if(tolerance < 0)
                  {
                     tolerance = -tolerance;
                  }
                  Global.tolerance = tolerance;
               }
               bitmaptolerance = Number(flist[7].input.text);
               if(!isNaN(bitmaptolerance) && bitmaptolerance != 0)
               {
                  if(bitmaptolerance < 0)
                  {
                     bitmaptolerance = -bitmaptolerance;
                  }
                  Global.bitmaptolerance = bitmaptolerance;
               }
               bitmapsize = Number(flist[8].input.text);
               if(!isNaN(bitmapsize))
               {
                  if(bitmapsize < 400)
                  {
                     bitmapsize = 400;
                  }
                  if(bitmapsize > Global.maxbitmapsize)
                  {
                     bitmapsize = Global.maxbitmapsize;
                  }
                  Global.bitmapsize = Math.floor(bitmapsize);
               }
               nestbitmapsize = Number(flist[9].input.text);
               if(!isNaN(nestbitmapsize))
               {
                  if(nestbitmapsize < 1000)
                  {
                     nestbitmapsize = 1000;
                  }
                  if(nestbitmapsize > Global.maxbitmapsize)
                  {
                     nestbitmapsize = Global.maxbitmapsize;
                  }
                  Global.nestbitmapsize = Math.floor(nestbitmapsize);
               }
               Global.separatetoolpaths = flist[10].input.selected;
               break;
            case "addcircle":
               dia = Number(flist[0].input.text);
               if(!isNaN(dia) && dia != 0)
               {
                  if(dia < 0)
                  {
                     dia = Math.abs(dia);
                  }
                  this.addEllipse(dia,dia);
               }
               break;
            case "addellipse":
               ew = Number(flist[0].input.text);
               eh = Number(flist[1].input.text);
               if(!isNaN(ew) && ew != 0 && !isNaN(eh) && eh != 0)
               {
                  if(ew < 0)
                  {
                     ew = Math.abs(ew);
                  }
                  if(eh < 0)
                  {
                     eh = Math.abs(eh);
                  }
                  this.addEllipse(ew,eh);
               }
               break;
            case "addrectangle":
               rw = Number(flist[0].input.text);
               rh = Number(flist[1].input.text);
               if(!isNaN(rw) && rw != 0 && !isNaN(rh) && rh != 0)
               {
                  if(rw < 0)
                  {
                     rw = Math.abs(rw);
                  }
                  if(rh < 0)
                  {
                     rh = Math.abs(rh);
                  }
                  this.addRect(rw,rh,0,false);
               }
               break;
            case "addroundedrectangle":
               rw1 = Number(flist[0].input.text);
               rh1 = Number(flist[1].input.text);
               rad = Number(flist[2].input.text);
               if(!isNaN(rw1) && rw1 != 0 && !isNaN(rh1) && rh1 != 0)
               {
                  if(rw1 < 0)
                  {
                     rw1 = Math.abs(rw1);
                  }
                  if(rh < 0)
                  {
                     rh1 = Math.abs(rh1);
                  }
                  if(rad < 0)
                  {
                     rad = Math.abs(rad);
                  }
                  this.addRect(rw1,rh1,rad,true);
               }
               break;
            case "addpolygon":
               sides = Math.floor(Number(flist[0].input.text));
               rad1 = Number(flist[1].input.text);
               if(!isNaN(sides) && sides != 0 && !isNaN(rad1) && rad1 != 0)
               {
                  if(sides < 0)
                  {
                     sides = Math.abs(sides);
                  }
                  if(rad1 < 0)
                  {
                     rad1 = Math.abs(rad1);
                  }
                  if(sides >= 3)
                  {
                     this.addPolygon(sides,rad1);
                  }
               }
               break;
            case "addstar":
               points = Math.floor(Number(flist[0].input.text));
               rad2 = Number(flist[1].input.text);
               pointiness = Number(flist[2].input.text);
               if(!isNaN(points) && points != 0 && !isNaN(rad2) && rad2 != 0 && !isNaN(pointiness))
               {
                  if(points < 0)
                  {
                     points = Math.abs(points);
                  }
                  if(rad2 < 0)
                  {
                     rad2 = Math.abs(rad1);
                  }
                  if(pointiness < 0)
                  {
                     pointiness = Math.abs(pointiness);
                  }
                  if(pointiness > 99)
                  {
                     pointiness = 99;
                  }
                  if(points >= 3)
                  {
                     this.addStar(points,rad2,pointiness);
                  }
               }
               break;
            case "profile":
               this.scene.zeroSelected();
               this.scene.profile(flist);
               this.scene.pathsOnTop();
               break;
            case "editprofile":
               this.scene.zeroSelected();
               this.scene.editprofile(flist);
               this.scene.pathsOnTop();
               break;
            case "pocket":
               this.scene.zeroSelected();
               this.scene.pocket(flist);
               this.scene.pathsOnTop();
               break;
            case "editpocket":
               this.scene.zeroSelected();
               this.scene.editpocket(flist);
               this.scene.pathsOnTop();
               break;
            case "followpath":
               this.scene.zeroSelected();
               this.scene.followpath(flist);
               this.scene.pathsOnTop();
               break;
            case "editfollowpath":
               this.scene.zeroSelected();
               this.scene.editfollowpath(flist);
               this.scene.pathsOnTop();
               break;
            case "drill":
               this.scene.zeroSelected();
               this.scene.drill(flist);
               this.scene.pathsOnTop();
               break;
            case "editdrill":
               this.scene.zeroSelected();
               this.scene.editdrill(flist);
               this.scene.pathsOnTop();
               break;
            case "batch":
               this.scene.zeroSelected();
               this.scene.batch(flist);
               this.scene.pathsOnTop();
               break;
            case "startnest":
               pd = this.startProgressDialog(250,75,"Optimizing Nesting Solution","Stop",this.scene.finishNest);
               divs = Number(flist[0].input.text);
               gap = Number(flist[1].input.text);
               group = Boolean(flist[2].input.selected);
               groupprofile = Boolean(flist[3].input.selected);
               if(!this.scene.startNest(pd,divs,gap,group,groupprofile))
               {
                  pd.stopDialog();
                  this.scene.redraw();
                  this.startDialog(270,50,new Array({
                     "type":"label",
                     "label":"At least 2 objects are required for nesting"
                  }),"error");
               }
               break;
            case "tabs":
               tabspacing = Number(flist[0].input.text);
               tabwidth = Number(flist[1].input.text);
               tabheight = Number(flist[2].input.text);
               if(isNaN(tabspacing) || tabspacing <= 0 || isNaN(tabwidth) || tabwidth <= 0 || isNaN(tabheight) || tabheight <= 0 || tabspacing <= tabwidth)
               {
                  this.startDialog(100,50,new Array({
                     "type":"label",
                     "label":"Invalid input"
                  }),"error");
                  return;
               }
               this.scene.addTabsSelected(tabspacing,tabwidth,tabheight);
               break;
            case "exportgcode":
               cutlist = new Array();
               listitems = flist[0].input.selectedItems;
               for(i = 0; i < listitems.length; i++)
               {
                  obj = listitems[i];
                  cutlist.push(obj.data);
               }
               if(cutlist.length > 0)
               {
                  this.exportGcode(cutlist);
               }
         }
      }
      
      public function addEllipse(ew:Number, eh:Number) : void
      {
         var middle:Point = new Point((Global.docwidth / 2 - Global.xorigin) / Global.zoom,(-(Global.docheight / 2) + Global.yorigin) / Global.zoom);
         var cx:Number = middle.x;
         var cy:Number = middle.y;
         var rx:Number = ew / 2;
         var ry:Number = eh / 2;
         var ob:Object = {
            "cx":cx + Global.unit,
            "cy":cy + Global.unit,
            "rx":rx + Global.unit,
            "ry":ry + Global.unit
         };
         var svgtemp:SVGToPath = new SVGToPath();
         var p:Path = svgtemp.parseEllipse(ob);
         if(p != null)
         {
            this.scene.addPath(p);
            this.scene.redraw();
         }
         svgtemp = null;
      }
      
      public function addRect(rw:Number, rh:Number, radius:Number, round:Boolean) : void
      {
         var middle:Point = new Point((Global.docwidth / 2 - Global.xorigin) / Global.zoom,(-(Global.docheight / 2) + Global.yorigin) / Global.zoom);
         var ob:Object = {
            "isRound":round,
            "rx":radius + Global.unit,
            "ry":radius + Global.unit,
            "x":middle.x - rw / 2 + Global.unit,
            "y":middle.y - rh / 2 + Global.unit,
            "width":rw + Global.unit,
            "height":rh + Global.unit
         };
         var svgtemp:SVGToPath = new SVGToPath();
         var p:Path = svgtemp.parseRect(ob);
         if(p != null)
         {
            this.scene.addPath(p);
            this.scene.redraw();
         }
         svgtemp = null;
      }
      
      public function addPolygon(sides:int, radius:Number) : void
      {
         var cpoint:Point = null;
         var seg:Segment = null;
         if(sides < 3)
         {
            sides = 3;
         }
         var p:Path = new Path();
         var lpoint:Point = new Point(0,radius);
         var origin:Point = lpoint;
         for(var i:int = 360 / sides; i < 360; i += 360 / sides)
         {
            cpoint = new Point(radius * Math.sin(i * Math.PI / 180),radius * Math.cos(i * Math.PI / 180));
            seg = new Segment(lpoint,cpoint);
            lpoint = cpoint;
            p.addSegment(seg);
         }
         seg = new Segment(cpoint,origin);
         p.addSegment(seg);
         var middle:Point = new Point((Global.docwidth / 2 - Global.xorigin) / Global.zoom,(-(Global.docheight / 2) + Global.yorigin) / Global.zoom);
         p.docx = middle.x;
         p.docy = -middle.y;
         this.scene.addPath(p);
         this.scene.redraw();
      }
      
      public function addStar(points:int, radius:Number, pointiness:Number) : void
      {
         var cpoint:Point = null;
         var ipoint:Point = null;
         var seg:Segment = null;
         if(points < 3)
         {
            points = 3;
         }
         var p:Path = new Path();
         var lpoint:Point = new Point(0,radius);
         var origin:Point = lpoint;
         for(var i:int = 360 / points; i < 360; i += 360 / points)
         {
            cpoint = new Point(radius * Math.sin(i * Math.PI / 180),radius * Math.cos(i * Math.PI / 180));
            ipoint = new Point(radius * ((100 - pointiness) / 100) * Math.sin((i - 180 / points) * Math.PI / 180),radius * ((100 - pointiness) / 100) * Math.cos((i - 180 / points) * Math.PI / 180));
            seg = new Segment(lpoint,ipoint);
            p.addSegment(seg);
            seg = new Segment(ipoint,cpoint);
            p.addSegment(seg);
            lpoint = cpoint;
         }
         ipoint = new Point(radius * ((100 - pointiness) / 100) * Math.sin((i - 180 / points) * Math.PI / 180),radius * ((100 - pointiness) / 100) * Math.cos((i - 180 / points) * Math.PI / 180));
         seg = new Segment(cpoint,ipoint);
         p.addSegment(seg);
         seg = new Segment(ipoint,origin);
         p.addSegment(seg);
         var middle:Point = new Point((Global.docwidth / 2 - Global.xorigin) / Global.zoom,(-(Global.docheight / 2) + Global.yorigin) / Global.zoom);
         p.docx = middle.x;
         p.docy = -middle.y;
         this.scene.addPath(p);
         this.scene.redraw();
      }
      
      public function startPen(e:MouseEvent) : void
      {
         if(this.pen == null)
         {
            this.pen = new Pen(new Point(this.scene.mouseX / Global.zoom,-this.scene.mouseY / Global.zoom));
            this.pen.mousedown = true;
            this.scene.addPath(this.pen);
            addEventListener(MouseEvent.MOUSE_MOVE,this.movePen);
            addEventListener(MouseEvent.MOUSE_UP,this.upPen);
         }
         else
         {
            this.pen.startPoint(new Point(this.scene.mouseX / Global.zoom,-this.scene.mouseY / Global.zoom));
            this.pen.mousedown = true;
         }
      }
      
      public function movePen(e:MouseEvent) : void
      {
         this.pen.setPosition();
      }
      
      public function upPen(e:MouseEvent) : void
      {
         this.pen.mousedown = false;
         this.pen.finishPoint();
      }
      
      public function finishPen() : void
      {
         if(this.pen != null)
         {
            removeEventListener(MouseEvent.MOUSE_MOVE,this.movePen);
            removeEventListener(MouseEvent.MOUSE_UP,this.upPen);
            this.pen.redraw();
            this.pen = null;
         }
      }
      
      public function startSketch(e:MouseEvent) : void
      {
         if(e.target is Dot)
         {
            this.sketchdot = e.target as Dot;
         }
         Global.dragging = true;
         this.sketch = new Sketch(new Point(e.stageX,e.stageY));
         addChild(this.sketch);
         addEventListener(MouseEvent.MOUSE_MOVE,this.moveSketch);
         addEventListener(MouseEvent.MOUSE_UP,this.upSketch);
         stage.addEventListener(Event.MOUSE_LEAVE,this.upSketch);
         this.timer = new Timer(0,0);
         this.timer.addEventListener(TimerEvent.TIMER,this.timeIncrement);
         this.timer.start();
      }
      
      public function moveSketch(e:MouseEvent) : void
      {
         var p:Point = new Point(e.stageX,e.stageY);
         this.sketch.lineTo(p);
         this.sketch.addPoint(p);
         this.sketch.addTime(this.now);
      }
      
      public function upSketch(e:Event) : void
      {
         var seglist:Array = null;
         var intersect:Point = null;
         removeEventListener(MouseEvent.MOUSE_MOVE,this.moveSketch);
         removeEventListener(MouseEvent.MOUSE_UP,this.upSketch);
         stage.removeEventListener(Event.MOUSE_LEAVE,this.upSketch);
         this.timer.removeEventListener(TimerEvent.TIMER,this.timeIncrement);
         this.now = 0;
         var path:Path = this.sketch.getPath();
         if(path != null)
         {
            path.docx = -Global.xorigin / Global.zoom;
            path.docy = -Global.yorigin / Global.zoom;
            path.x = -Global.xorigin;
            path.y = -Global.yorigin;
            if(this.sketchdot != null)
            {
               this.sketchdot.looppath.mergePath(path,this.sketchdot.point);
               this.sketchdot.looppath.setInactive();
               this.sketchdot = null;
            }
            else
            {
               if(path.seglist.length > 2)
               {
                  seglist = path.seglist;
                  intersect = Global.lineIntersect(seglist[0].p1,seglist[0].p2,seglist[seglist.length - 1].p1,seglist[seglist.length - 1].p2,true);
                  if(intersect != null && !isNaN(intersect.x) && !isNaN(intersect.y))
                  {
                     seglist[0].p1 = intersect;
                     seglist[seglist.length - 1].p2 = intersect;
                  }
               }
               path.redrawDots();
               this.scene.addPath(path);
            }
         }
         Global.dragging = false;
         removeChild(this.sketch);
      }
      
      public function timeIncrement(e:TimerEvent) : void
      {
         ++this.now;
      }
   }
}

