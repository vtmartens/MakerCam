using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using MakerCam.Core;

namespace MakerCam.App;

public partial class MainWindow : Window
{
    private readonly AppController _controller;
    private bool _uiReady;

    public MainWindow()
    {
        InitializeComponent();
        _controller = new AppController(this);
    }

    public AppController Controller => _controller;

    private void Command_Click(object sender, RoutedEventArgs e)
    {
        if (sender is FrameworkElement { Tag: string command }) _controller.HandleCommand(command);
    }

    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        // Start first so programmatic unit selection does not look like a user change.
        _controller.Start();
        _uiReady = true;
    }

    private void Window_Closing(object? sender, CancelEventArgs e)
    {
        if (!_controller.ConfirmClose())
        {
            e.Cancel = true;
            return;
        }
        _controller.SavePrefs();
    }

    private void Window_DragOver(object sender, DragEventArgs e)
    {
        e.Effects = e.Data.GetDataPresent(DataFormats.FileDrop)
            ? DragDropEffects.Copy
            : DragDropEffects.None;
        e.Handled = true;
    }

    private void Window_Drop(object sender, DragEventArgs e)
    {
        if (e.Data.GetData(DataFormats.FileDrop) is string[] { Length: > 0 } files)
        {
            _controller.OpenExternalFile(files[0]);
        }
        e.Handled = true;
    }

    private void UnitSelect_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (!_uiReady) return;
        if (UnitSelect.SelectedItem is ComboBoxItem { Tag: string tag })
        {
            _controller.SetUnit(tag == "in" ? Unit.In : Unit.Mm);
        }
    }

    /// <summary>Shows a transient message in the lower-right of the canvas.</summary>
    public void ShowToast(string message, string kind = "info", int timeoutMs = 3800)
    {
        var accent = kind switch
        {
            "success" => Color.FromRgb(0x12, 0x82, 0x4c),
            "warning" => Color.FromRgb(0xb8, 0x6e, 0x00),
            "error" => Color.FromRgb(0xcc, 0x2b, 0x2b),
            _ => Color.FromRgb(0x0a, 0x84, 0xff),
        };

        var border = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(242, 0x24, 0x27, 0x2a)),
            BorderBrush = new SolidColorBrush(accent),
            BorderThickness = new Thickness(3, 0, 0, 0),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(13, 9, 13, 9),
            Margin = new Thickness(0, 0, 0, 8),
            MaxWidth = 400,
            Child = new TextBlock
            {
                Text = message,
                TextWrapping = TextWrapping.Wrap,
                Foreground = Brushes.White,
                FontSize = 12.5,
            },
        };

        ToastHost.Children.Add(border);
        while (ToastHost.Children.Count > 4) ToastHost.Children.RemoveAt(0);

        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(Math.Max(600, timeoutMs)) };
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            ToastHost.Children.Remove(border);
        };
        timer.Start();

        border.MouseLeftButtonDown += (_, _) =>
        {
            timer.Stop();
            ToastHost.Children.Remove(border);
        };
    }

    public void SetStatus(string? coords = null, string? zoom = null, string? selection = null, string? hint = null)
    {
        if (coords is not null) StatusCoords.Text = coords;
        if (zoom is not null) StatusZoom.Text = zoom;
        if (selection is not null) StatusSelection.Text = selection;
        if (hint is not null) StatusHint.Text = hint;
    }

    public void SetToolButtons(Tool tool)
    {
        ToolSelect.IsChecked = tool == Tool.Select;
        ToolPan.IsChecked = tool == Tool.Pan;
        ToolPen.IsChecked = tool == Tool.Pen;
    }

    public void SetToggleStates(bool grid, bool snap, bool toolpaths, bool diameter)
    {
        GridToggle.IsChecked = grid;
        SnapToggle.IsChecked = snap;
        PathsToggle.IsChecked = toolpaths;
        CutterToggle.IsChecked = diameter;
    }

    public void SetUnitSelection(Unit unit)
    {
        UnitSelect.SelectedIndex = unit == Unit.In ? 1 : 0;
    }

    public void SetEmptyStateVisible(bool visible)
    {
        EmptyState.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;
    }

    public void SetSidebarVisible(bool visible)
    {
        SidebarColumn.Width = visible ? new GridLength(310) : new GridLength(0);
        Sidebar.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;
    }

    public void SetOperationCount(string text) => OpCount.Text = text;

    /// <summary>Rebuilds File → Recent Files from the controller's list.</summary>
    public void SetRecentFiles(IReadOnlyList<string> files)
    {
        RecentFilesMenu.Items.Clear();

        if (files.Count == 0)
        {
            RecentFilesMenu.Items.Add(new MenuItem
            {
                Header = "No recent files",
                IsEnabled = false,
            });
            return;
        }

        foreach (var file in files)
        {
            var item = new MenuItem
            {
                Header = System.IO.Path.GetFileName(file),
                ToolTip = file,
                Tag = file,
            };
            item.Click += (_, _) => _controller.OpenExternalFile(file);
            RecentFilesMenu.Items.Add(item);
        }

        RecentFilesMenu.Items.Add(new Separator());
        var clear = new MenuItem { Header = "Clear recent files" };
        clear.Click += (_, _) => _controller.ClearRecentFiles();
        RecentFilesMenu.Items.Add(clear);
    }

    public void SetExportEnabled(bool enabled) => ExportButton.IsEnabled = enabled;

    public StackPanel OperationList => OpList;

    public DrawingCanvas DrawingArea => Canvas;

    public void SetSidebarHint(string text) => SidebarHint.Text = text;
}
