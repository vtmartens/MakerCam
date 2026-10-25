package com.partkart
{
   import fl.controls.*;
   import flash.display.*;
   import flash.events.*;
   import flash.filters.DropShadowFilter;
   import flash.geom.Matrix;
   import flash.text.*;
   
   public class ProgressDialog extends Sprite
   {
      
      private var dwidth:int;
      
      private var dheight:int;
      
      private var stoplabel:String;
      
      private var back:Shape;
      
      private var progressbar:pBar;
      
      private var oncancel:Function = null;
      
      public var total:Number = 1;
      
      internal var titlelabel:TextField;
      
      public function ProgressDialog(dialogwidth:int, dialogheight:int, dialogmessage:String = "processing", dialoglabel:String = "Cancel", callback:Function = null)
      {
         super();
         this.dwidth = dialogwidth;
         this.dheight = dialogheight;
         name = dialogmessage;
         this.stoplabel = dialoglabel;
         this.oncancel = callback;
      }
      
      public function init(progresstotal:Number) : void
      {
         var shadowfilter:DropShadowFilter = null;
         var stop:Button = null;
         this.total = progresstotal;
         this.back = new Shape();
         var m:Matrix = new Matrix(this.dwidth / 1000,0,0,this.dheight / 1000,this.dwidth / 2,this.dheight / 2);
         this.back.graphics.beginGradientFill(GradientType.RADIAL,[4473924,2236962],[1,1],[50,255],m);
         this.back.graphics.drawRoundRect(0,0,this.dwidth,this.dheight,20,20);
         this.back.graphics.endFill();
         addChild(this.back);
         addEventListener(MouseEvent.MOUSE_DOWN,this.dialogDown);
         addEventListener(MouseEvent.MOUSE_UP,this.dialogUp);
         shadowfilter = new DropShadowFilter(2,45,0,0.65,3,3);
         var format:TextFormat = new TextFormat("Arial",11);
         this.titlelabel = new TextField();
         this.titlelabel.defaultTextFormat = format;
         this.titlelabel.type = TextFieldType.DYNAMIC;
         this.titlelabel.multiline = false;
         this.titlelabel.height = 20;
         this.titlelabel.width = this.width - 10;
         this.titlelabel.x = 8;
         this.titlelabel.y = 10;
         this.titlelabel.filters = [shadowfilter];
         this.titlelabel.textColor = 16777215;
         this.titlelabel.text = name + " (0%)";
         addChild(this.titlelabel);
         this.progressbar = new pBar();
         this.progressbar.width = this.dwidth - 20;
         this.progressbar.x = 10;
         this.progressbar.y = 30;
         addChild(this.progressbar);
         if(this.oncancel != null)
         {
            stop = new Button();
            stop.label = this.stoplabel;
            stop.width = 50;
            stop.x = this.dwidth / 2 - 25;
            stop.y = 40;
            addChild(stop);
            stop.addEventListener(MouseEvent.CLICK,this.endDialog);
         }
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
      
      private function endDialog(e:MouseEvent) : void
      {
         this.stopDialog();
         if(this.oncancel !== null)
         {
            this.oncancel();
         }
      }
      
      public function stopDialog() : void
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
      
      public function setProgress(p:Number) : void
      {
         this.progressbar.width = (this.dwidth - 20) * (p / this.total);
         this.titlelabel.text = name + " (" + Math.round(100 * (p / this.total)) + "%)";
      }
   }
}

