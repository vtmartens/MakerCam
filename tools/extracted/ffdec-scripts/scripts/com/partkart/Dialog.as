package com.partkart
{
   import fl.controls.Button;
   import fl.controls.CheckBox;
   import fl.controls.ComboBox;
   import fl.controls.List;
   import flash.display.*;
   import flash.events.*;
   import flash.filters.DropShadowFilter;
   import flash.geom.Matrix;
   import flash.net.FileFilter;
   import flash.net.FileReference;
   import flash.text.*;
   
   public class Dialog extends Sprite
   {
      
      private var flist:Array;
      
      private var dwidth:int;
      
      private var dheight:int;
      
      private var back:Shape;
      
      private var clsprite:Sprite;
      
      private var file:FileReference;
      
      private var submitlabel:String;
      
      private var closewindow:Boolean;
      
      public function Dialog(dialogwidth:int, dialogheight:int, fieldlist:Array, inputlabel:String = "OK", inputclose:Boolean = true)
      {
         super();
         this.dwidth = dialogwidth;
         this.dheight = dialogheight;
         this.flist = fieldlist;
         this.submitlabel = inputlabel;
         this.closewindow = inputclose;
         this.init();
         this.populateFields();
      }
      
      private function init() : void
      {
         this.back = new Shape();
         var m:Matrix = new Matrix(this.dwidth / 1000,0,0,this.dheight / 1000,this.dwidth / 2,this.dheight / 2);
         this.back.graphics.beginGradientFill(GradientType.RADIAL,[4473924,2236962],[1,1],[50,255],m);
         this.back.graphics.drawRoundRect(0,0,this.dwidth,this.dheight,20,20);
         this.back.graphics.endFill();
         addChild(this.back);
         addEventListener(MouseEvent.MOUSE_DOWN,this.dialogDown);
         addEventListener(MouseEvent.MOUSE_UP,this.dialogUp);
         this.clsprite = new Sprite();
         var cl:* = new Shape();
         cl.graphics.beginFill(16711680);
         cl.graphics.drawCircle(0,0,8);
         cl.graphics.endFill();
         cl.graphics.lineStyle(2,16777215,1,false,LineScaleMode.NONE,CapsStyle.ROUND);
         cl.graphics.moveTo(-3,-3);
         cl.graphics.lineTo(3,3);
         cl.graphics.moveTo(3,-3);
         cl.graphics.lineTo(-3,3);
         this.clsprite.addChild(cl);
         this.clsprite.x = this.dwidth - 13;
         this.clsprite.y = 13;
         addChild(this.clsprite);
         this.clsprite.alpha = 0.7;
         this.clsprite.addEventListener(MouseEvent.CLICK,this.closeDialog);
         this.clsprite.addEventListener(MouseEvent.MOUSE_OVER,this.closeOver);
         this.clsprite.addEventListener(MouseEvent.MOUSE_OUT,this.closeOut);
      }
      
      private function populateFields() : void
      {
         var i:int;
         var buttonwidth:Number;
         var submit:Button;
         var shadowfilter:DropShadowFilter = null;
         var input:TextField = null;
         var f:Object = null;
         var combobox:ComboBox = null;
         var browse:Button = null;
         var checkbox:CheckBox = null;
         var fo:TextFormat = null;
         var listbox:List = null;
         var cutlist:List = null;
         var up:Button = null;
         var uphandler:Function = null;
         var down:Button = null;
         var downhandler:Function = null;
         var sort:Button = null;
         var desc:Boolean = false;
         var sorthandler:Function = null;
         var profile:Button = null;
         var profilehandler:Function = null;
         var all:Button = null;
         var allhandler:Function = null;
         var item:Object = null;
         var obj:Object = null;
         var selectedcuts:Array = null;
         var vposition:int = 30;
         var hposition:int = 20;
         var format:TextFormat = new TextFormat("Arial",11);
         shadowfilter = new DropShadowFilter(2,45,0,0.65,3,3);
         for(i = 0; i < this.flist.length; i++)
         {
            f = this.flist[i];
            switch(f.type)
            {
               case "label":
                  this.addLabel(f,hposition,vposition);
                  break;
               case "number":
                  this.addLabel(f,hposition,vposition);
                  input = new TextField();
                  input.restrict = "0-9.\\-";
                  input.defaultTextFormat = format;
                  input.type = TextFieldType.INPUT;
                  input.multiline = false;
                  input.height = 20;
                  input.width = this.dwidth - hposition * 2;
                  input.background = true;
                  input.x = this.dwidth;
                  input.y = vposition;
                  input.filters = [shadowfilter];
                  if(f.value)
                  {
                     input.text = f.value;
                  }
                  if(f.highlight)
                  {
                     input.backgroundColor = 16776110;
                  }
                  f.input = input;
                  addChild(input);
                  break;
               case "string":
                  this.addLabel(f,hposition,vposition);
                  input = new TextField();
                  input.defaultTextFormat = format;
                  input.type = TextFieldType.INPUT;
                  input.multiline = false;
                  input.height = 20;
                  input.width = this.dwidth - hposition * 2;
                  input.background = true;
                  input.x = this.dwidth;
                  input.y = vposition;
                  input.filters = [shadowfilter];
                  if(f.value)
                  {
                     input.text = f.value;
                  }
                  f.input = input;
                  addChild(input);
                  break;
               case "combobox":
                  if(f.label)
                  {
                     this.addLabel(f,hposition,vposition);
                  }
                  combobox = new ComboBox();
                  if(f.items)
                  {
                     for each(item in f.items)
                     {
                        combobox.addItem(item);
                        if(f.value != null && f.value == item.data)
                        {
                           combobox.selectedItem = item;
                        }
                     }
                  }
                  combobox.height = 20;
                  combobox.width = this.dwidth - hposition * 2;
                  if(f.label)
                  {
                     combobox.x = this.dwidth;
                  }
                  else
                  {
                     combobox.x = hposition;
                  }
                  combobox.y = vposition;
                  combobox.filters = [shadowfilter];
                  f.input = combobox;
                  addChild(combobox);
                  break;
               case "file":
                  this.addLabel(f,hposition,vposition);
                  browse = new Button();
                  browse.label = "Browse";
                  browse.width = 80;
                  browse.x = this.dwidth;
                  browse.y = vposition;
                  addChild(browse);
                  browse.addEventListener(MouseEvent.CLICK,this.browseAction);
                  break;
               case "checkbox":
                  checkbox = new CheckBox();
                  fo = new TextFormat("Arial",11);
                  fo.color = 16777215;
                  checkbox.setStyle("textFormat",fo);
                  checkbox.selected = f.value;
                  checkbox.x = hposition;
                  checkbox.y = vposition;
                  checkbox.width = this.dwidth;
                  checkbox.label = f.label;
                  f.input = checkbox;
                  addChild(checkbox);
                  break;
               case "listbox":
                  this.addLabel(f,hposition,vposition);
                  listbox = new List();
                  listbox.allowMultipleSelection = true;
                  listbox.width = this.dwidth - hposition * 2;
                  listbox.height = 200;
                  listbox.x = hposition;
                  listbox.y = vposition + 20;
                  if(Boolean(f.value) && f.value.length > 0)
                  {
                     for each(obj in f.value)
                     {
                        listbox.addItem(obj);
                     }
                  }
                  vposition += 200;
                  f.input = listbox;
                  addChild(listbox);
                  break;
               case "cutlist":
                  this.addLabel(f,hposition,vposition);
                  cutlist = new List();
                  cutlist.name = "cutlist";
                  cutlist.allowMultipleSelection = true;
                  cutlist.width = this.dwidth;
                  cutlist.height = 200;
                  cutlist.x = hposition;
                  cutlist.y = vposition + 20;
                  if(Boolean(f.value) && f.value.length > 0)
                  {
                     for each(obj in f.value)
                     {
                        cutlist.addItem(obj);
                     }
                     selectedcuts = new Array();
                     for each(obj in f.value)
                     {
                        if(obj.active)
                        {
                           selectedcuts.push(obj);
                        }
                     }
                     cutlist.selectedItems = selectedcuts;
                  }
                  vposition += 210;
                  up = new Button();
                  up.label = "+";
                  up.width = 20;
                  up.x = hposition;
                  up.y = vposition + 20;
                  addChild(up);
                  uphandler = function(e:MouseEvent):void
                  {
                     var obj:Object = null;
                     for(var i:int = 0; i < cutlist.length; i++)
                     {
                        obj = cutlist.getItemAt(i);
                        if(i > 0 && cutlist.isItemSelected(obj))
                        {
                           cutlist.removeItemAt(i);
                           cutlist.addItemAt(obj,i - 1);
                           cutlist.selectedIndex = i - 1;
                           break;
                        }
                     }
                  };
                  up.addEventListener(MouseEvent.CLICK,uphandler);
                  down = new Button();
                  down.label = "-";
                  down.width = 20;
                  down.x = hposition + 25;
                  down.y = vposition + 20;
                  addChild(down);
                  downhandler = function(e:MouseEvent):void
                  {
                     var obj:Object = null;
                     for(var i:int = 0; i < cutlist.length; i++)
                     {
                        obj = cutlist.getItemAt(i);
                        if(i < cutlist.length - 1 && cutlist.isItemSelected(obj))
                        {
                           cutlist.removeItemAt(i);
                           cutlist.addItemAt(obj,i + 1);
                           cutlist.selectedIndex = i + 1;
                           break;
                        }
                     }
                  };
                  down.addEventListener(MouseEvent.CLICK,downhandler);
                  sort = new Button();
                  sort.label = "sort by tool";
                  sort.width = 80;
                  sort.x = hposition + 50;
                  sort.y = vposition + 20;
                  addChild(sort);
                  desc = true;
                  sorthandler = function(e:MouseEvent):void
                  {
                     if(desc)
                     {
                        cutlist.sortItemsOn("diameter",Array.NUMERIC | Array.DESCENDING);
                     }
                     else
                     {
                        cutlist.sortItemsOn("diameter",Array.NUMERIC);
                     }
                     desc = !desc;
                  };
                  sort.addEventListener(MouseEvent.CLICK,sorthandler);
                  profile = new Button();
                  profile.label = "profiles last";
                  profile.width = 80;
                  profile.x = hposition + 135;
                  profile.y = vposition + 20;
                  addChild(profile);
                  profilehandler = function(e:MouseEvent):void
                  {
                     var obj:Object = null;
                     var num:* = int(cutlist.length);
                     for(var i:* = 0; i < num; i++)
                     {
                        obj = cutlist.getItemAt(i);
                        if(obj.data is ProfileCutObject)
                        {
                           cutlist.removeItemAt(i);
                           cutlist.addItem(obj);
                           i--;
                           num--;
                        }
                     }
                  };
                  profile.addEventListener(MouseEvent.CLICK,profilehandler);
                  all = new Button();
                  all.label = "all";
                  all.width = 30;
                  all.x = hposition + 220;
                  all.y = vposition + 20;
                  addChild(all);
                  allhandler = function(e:MouseEvent):void
                  {
                     var selected:Array = new Array();
                     for(var i:int = 0; i < cutlist.length; i++)
                     {
                        selected.push(cutlist.getItemAt(i));
                     }
                     cutlist.selectedItems = selected;
                  };
                  all.addEventListener(MouseEvent.CLICK,allhandler);
                  f.input = cutlist;
                  addChild(cutlist);
                  vposition += 20;
            }
            if(f.type != "label" && f.type != "checkbox")
            {
               vposition += 30;
            }
            else
            {
               vposition += 20;
            }
         }
         vposition += 10;
         if(this.width > this.back.width)
         {
            this.back.width = this.width + 20;
         }
         if(this.height > this.back.height)
         {
            this.back.height = this.height - 20;
         }
         this.clsprite.x = this.back.width - 20;
         buttonwidth = Math.max(50,this.submitlabel.length * 7);
         submit = new Button();
         submit.label = this.submitlabel;
         submit.width = buttonwidth;
         submit.x = this.width / 2 - buttonwidth / 2;
         submit.y = vposition;
         addChild(submit);
         submit.addEventListener(MouseEvent.CLICK,this.processDialog);
         vposition += 30;
      }
      
      private function addLabel(f:Object, hposition:int, vposition:int) : void
      {
         var format:TextFormat = new TextFormat("Arial",11);
         var t:TextField = new TextField();
         t.defaultTextFormat = format;
         t.text = f.label;
         t.type = TextFieldType.DYNAMIC;
         t.multiline = false;
         t.selectable = false;
         t.x = hposition;
         t.y = vposition;
         t.textColor = 16777215;
         t.width = this.dwidth;
         addChild(t);
      }
      
      private function closeOver(e:MouseEvent) : void
      {
         e.target.alpha = 1;
      }
      
      private function closeOut(e:MouseEvent) : void
      {
         e.target.alpha = 0.7;
      }
      
      private function dialogDown(e:MouseEvent) : void
      {
         if(e.target == this || e.target is TextField && e.target.selectable == false)
         {
            startDrag();
         }
      }
      
      private function dialogUp(e:MouseEvent) : void
      {
         stopDrag();
      }
      
      private function closeDialog(e:MouseEvent) : void
      {
         var main:* = undefined;
         if(this.parent)
         {
            main = this.parent;
            main.endDialog();
            main.setCursor();
            this.parent.removeChild(this);
         }
      }
      
      private function processDialog(e:MouseEvent) : void
      {
         var main:* = undefined;
         if(this.parent)
         {
            main = this.parent;
            if(this.closewindow)
            {
               this.closeDialog(e);
            }
            main.processDialog(this.flist,this.name);
            return;
         }
         if(this.closewindow)
         {
            this.closeDialog(e);
         }
      }
      
      private function browseAction(e:MouseEvent) : void
      {
         this.file = new FileReference();
         this.file.addEventListener(Event.SELECT,this.fileSelect);
         this.file.addEventListener(Event.CANCEL,this.fileCancel);
         this.file.browse(new Array(new FileFilter("Images (*.jpg, *.jpeg, *.gif, *.png)","*.jpg;*.jpeg;*.gif;*.png")));
      }
      
      private function fileSelect(e:Event) : void
      {
         this.file.addEventListener(Event.COMPLETE,this.fileProcess);
         this.file.addEventListener(IOErrorEvent.IO_ERROR,this.fileError);
         this.file.load();
      }
      
      private function fileCancel(e:Event) : void
      {
         this.file = null;
      }
      
      private function fileProcess(e:Event) : void
      {
         var imgloader:Loader = new Loader();
         imgloader.loadBytes(e.target.data);
         this.flist[0].input = imgloader;
         this.file = null;
      }
      
      private function fileError(e:IOErrorEvent) : void
      {
         this.file = null;
      }
   }
}

