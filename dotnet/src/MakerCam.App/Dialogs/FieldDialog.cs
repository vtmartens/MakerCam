using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace MakerCam.App;

/// <summary>
/// A modal form built from field descriptors, mirroring the web app's
/// <c>openDialog</c>. Returns the values, or null when cancelled.
/// </summary>
public sealed class FieldDialog : Window
{
    private readonly List<(string Key, FieldType Type, Func<object?> Get)> _getters = new();
    private readonly TextBlock _error;
    private readonly Func<Dictionary<string, object?>, string?>? _validate;

    public Dictionary<string, object?>? Result { get; private set; }

    public FieldDialog(DialogOptions options)
    {
        Title = options.Title;
        Width = options.Wide ? 640 : 470;
        SizeToContent = SizeToContent.Height;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;
        ResizeMode = ResizeMode.NoResize;
        ShowInTaskbar = false;
        FontFamily = new FontFamily("Segoe UI");
        FontSize = 13;
        Background = (Brush)Application.Current.Resources["WindowBg"];
        Foreground = (Brush)Application.Current.Resources["TextBrush"];
        _validate = options.Validate;

        var root = new StackPanel { Margin = new Thickness(22, 18, 22, 16) };
        root.Children.Add(new TextBlock
        {
            Text = options.Title,
            FontSize = 18,
            FontWeight = FontWeights.SemiBold,
            Foreground = (Brush)Application.Current.Resources["TextBrush"],
        });

        if (!string.IsNullOrEmpty(options.Description))
        {
            root.Children.Add(new TextBlock
            {
                Text = options.Description,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 6, 0, 0),
                Foreground = (Brush)Application.Current.Resources["MutedBrush"],
            });
        }

        var fields = new StackPanel { Margin = new Thickness(0, 14, 0, 0) };
        foreach (var field in options.Fields) AddField(fields, field);

        root.Children.Add(new ScrollViewer
        {
            Content = fields,
            MaxHeight = 480,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
        });

        _error = new TextBlock
        {
            Foreground = (Brush)Application.Current.Resources["DangerBrush"],
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 10, 0, 0),
            Visibility = Visibility.Collapsed,
        };
        root.Children.Add(_error);

        var actions = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 18, 0, 0),
        };

        var cancel = new Button
        {
            Content = options.CancelLabel,
            Style = (Style)Application.Current.Resources["FlatButton"],
            MinWidth = 84,
            Margin = new Thickness(0, 0, 8, 0),
            IsCancel = true,
        };
        cancel.Click += (_, _) =>
        {
            Result = null;
            Close();
        };

        var submit = new Button
        {
            Content = options.SubmitLabel,
            Style = (Style)Application.Current.Resources["PrimaryButton"],
            MinWidth = 110,
            IsDefault = true,
        };
        submit.Click += (_, _) => Submit();

        actions.Children.Add(cancel);
        actions.Children.Add(submit);
        root.Children.Add(actions);

        Content = root;

        Loaded += (_, _) =>
        {
            // Focus the first editable control, as the web dialog does.
            var first = FindFirstInput(root);
            first?.Focus();
        };
    }

    private static Control? FindFirstInput(DependencyObject root)
    {
        foreach (var child in LogicalTreeHelper.GetChildren(root))
        {
            if (child is TextBox tb && tb.IsEnabled) return tb;
            if (child is ComboBox cb && cb.IsEnabled) return cb;
            if (child is DependencyObject dep)
            {
                var found = FindFirstInput(dep);
                if (found is not null) return found;
            }
        }
        return null;
    }

    private void Submit()
    {
        var values = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var (key, type, get) in _getters)
        {
            if (type == FieldType.Label) continue;
            values[key] = get();
        }

        var error = _validate?.Invoke(values);
        if (!string.IsNullOrEmpty(error))
        {
            _error.Text = error;
            _error.Visibility = Visibility.Visible;
            return;
        }

        Result = values;
        Close();
    }

    private void AddField(StackPanel parent, DialogField field)
    {
        if (field.Type == FieldType.Label)
        {
            parent.Children.Add(new TextBlock
            {
                Text = field.Label ?? string.Empty,
                TextWrapping = TextWrapping.Wrap,
                Foreground = (Brush)Application.Current.Resources["MutedBrush"],
                Margin = new Thickness(0, 2, 0, 8),
            });
            return;
        }

        var row = new StackPanel { Margin = new Thickness(0, 0, 0, 10) };

        if (field.Type == FieldType.Checkbox)
        {
            var check = new CheckBox
            {
                Content = field.Label ?? field.Key,
                IsChecked = field.Value is bool b && b,
                IsEnabled = !field.Disabled,
                VerticalContentAlignment = VerticalAlignment.Center,
            };
            row.Children.Add(check);
            _getters.Add((field.Key, field.Type, () => check.IsChecked == true));
        }
        else
        {
            row.Children.Add(new TextBlock
            {
                Text = field.Label ?? field.Key,
                FontWeight = FontWeights.SemiBold,
                Margin = new Thickness(0, 0, 0, 4),
                Foreground = (Brush)Application.Current.Resources["TextBrush"],
            });

            if (field.Type == FieldType.Select)
            {
                var combo = new ComboBox
                {
                    ItemsSource = field.Options ?? Array.Empty<FieldOption>(),
                    DisplayMemberPath = "Label",
                    SelectedValuePath = "Value",
                    Style = (Style)Application.Current.Resources["ComboStyle"],
                    IsEnabled = !field.Disabled,
                };
                var selected = (field.Options ?? Array.Empty<FieldOption>())
                    .FirstOrDefault(o => Equals(o.Value, field.Value));
                combo.SelectedItem = selected;
                row.Children.Add(combo);
                _getters.Add((field.Key, field.Type,
                    () => (combo.SelectedItem as FieldOption)?.Value ?? combo.SelectedValue));
            }
            else if (field.Type == FieldType.Password)
            {
                var password = new PasswordBox
                {
                    Password = field.Value?.ToString() ?? string.Empty,
                    IsEnabled = !field.Disabled,
                    Padding = new Thickness(6, 5, 6, 5),
                    BorderBrush = (Brush)Application.Current.Resources["BorderStrong"],
                };
                row.Children.Add(password);
                _getters.Add((field.Key, field.Type, () => password.Password));
            }
            else
            {
                var text = new TextBox
                {
                    Text = field.Value?.ToString() ?? string.Empty,
                    Style = (Style)Application.Current.Resources["TextBoxStyle"],
                    IsEnabled = !field.Disabled,
                };
                if (field.Placeholder is not null) text.Tag = field.Placeholder;

                if (field.Suffix is null)
                {
                    row.Children.Add(text);
                }
                else
                {
                    var grid = new Grid();
                    grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                    grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                    grid.Children.Add(text);
                    var suffix = new TextBlock
                    {
                        Text = field.Suffix,
                        Margin = new Thickness(7, 0, 0, 0),
                        VerticalAlignment = VerticalAlignment.Center,
                        Foreground = (Brush)Application.Current.Resources["MutedBrush"],
                    };
                    Grid.SetColumn(suffix, 1);
                    grid.Children.Add(suffix);
                    row.Children.Add(grid);
                }

                if (field.Type == FieldType.Number)
                {
                    _getters.Add((field.Key, field.Type, () =>
                    {
                        var raw = text.Text.Trim();
                        if (raw.Length == 0) return double.NaN;
                        return double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var value)
                            ? value
                            : double.NaN;
                    }));
                }
                else
                {
                    _getters.Add((field.Key, field.Type, () => text.Text));
                }
            }
        }

        if (!string.IsNullOrEmpty(field.Help))
        {
            row.Children.Add(new TextBlock
            {
                Text = field.Help,
                TextWrapping = TextWrapping.Wrap,
                FontSize = 11.5,
                Margin = new Thickness(0, 4, 0, 0),
                Foreground = (Brush)Application.Current.Resources["MutedBrush"],
            });
        }

        parent.Children.Add(row);
    }
}

/// <summary>Convenience helpers for the controller.</summary>
public static class DialogService
{
    public static Dictionary<string, object?>? Show(Window owner, DialogOptions options)
    {
        var dialog = new FieldDialog(options) { Owner = owner };
        dialog.ShowDialog();
        return dialog.Result;
    }

    public static bool Confirm(Window owner, string message, string title = "Confirm")
    {
        var result = Show(owner, new DialogOptions
        {
            Title = title,
            Description = message,
            SubmitLabel = "Continue",
        });
        return result is not null;
    }

    public static void Error(Window owner, string title, string message)
    {
        Show(owner, new DialogOptions
        {
            Title = title,
            Description = message,
            SubmitLabel = "Close",
        });
    }
}
