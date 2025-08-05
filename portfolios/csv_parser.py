import csv
import io
import re
import yfinance as yf
from datetime import datetime
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from .models import Stock, PortfolioImport


class CSVPortfolioParser:
    """
    Parser for portfolio CSV files, primarily designed for Yahoo Finance exports
    but flexible enough to handle various CSV formats.
    """
    
    # Column mapping for different CSV formats
    COLUMN_MAPPINGS = {
        'symbol': ['Symbol', 'Ticker', 'Stock', 'SYMBOL', 'symbol', 'ticker'],
        'quantity': ['Quantity', 'Shares', 'Qty', 'QUANTITY', 'quantity', 'shares'],
        'purchase_price': [
            'Purchase Price', 'Buy Price', 'Cost Basis', 'PURCHASE_PRICE', 
            'purchase_price', 'Price Paid', 'Cost Per Share', 'Avg Cost'
        ],
        'purchase_date': [
            'Purchase Date', 'Buy Date', 'Date', 'PURCHASE_DATE', 
            'purchase_date', 'Date Acquired', 'Acquisition Date'
        ],
        'notes': ['Notes', 'NOTES', 'notes', 'Comments', 'Description']
    }
    
    def __init__(self, csv_content, filename, portfolio_import):
        self.csv_content = csv_content
        self.filename = filename
        self.portfolio_import = portfolio_import
        self.errors = []
        self.valid_rows = []
        self.column_mapping = {}
        self.total_rows = 0
        
    def parse_and_validate(self):
        """
        Main method to parse and validate CSV content
        Returns: dict with parsed data, errors, and statistics
        """
        try:
            # Detect CSV format and parse
            csv_data = self._parse_csv()
            if not csv_data:
                return self._create_result(success=False, error="Failed to parse CSV file")
            
            # Detect and map columns
            if not self._detect_column_mapping(csv_data[0]):
                return self._create_result(success=False, error="Required columns not found")
            
            # Process each row
            self._process_rows(csv_data[1:])  # Skip header row
            
            # Validate stock symbols in batch
            self._validate_stock_symbols()
            
            # Update import record
            self._update_import_record()
            
            return self._create_result(success=True)
            
        except Exception as e:
            self.errors.append({
                'type': 'system_error',
                'message': f"System error: {str(e)}",
                'row': 0
            })
            return self._create_result(success=False, error=str(e))
    
    def _parse_csv(self):
        """Parse CSV content with different delimiter detection"""
        try:
            # Try to detect delimiter
            sample = self.csv_content[:1024]
            sniffer = csv.Sniffer()
            
            try:
                delimiter = sniffer.sniff(sample).delimiter
            except:
                delimiter = ','  # Default to comma
            
            # Parse CSV
            csv_reader = csv.reader(io.StringIO(self.csv_content), delimiter=delimiter)
            return list(csv_reader)
            
        except Exception as e:
            self.errors.append({
                'type': 'parse_error',
                'message': f"Failed to parse CSV: {str(e)}",
                'row': 0
            })
            return None
    
    def _detect_column_mapping(self, header_row):
        """Detect and map CSV columns to our data model"""
        header_lower = [col.strip().lower() for col in header_row]
        
        for field, possible_names in self.COLUMN_MAPPINGS.items():
            found = False
            for i, header in enumerate(header_row):
                if header.strip() in possible_names or header.strip().lower() in [name.lower() for name in possible_names]:
                    self.column_mapping[field] = i
                    found = True
                    break
            
            # Check if required fields are found (only symbol is truly required)
            if field in ['symbol'] and not found:
                self.errors.append({
                    'type': 'column_error',
                    'message': f"Required column '{field}' not found. Looking for: {', '.join(possible_names)}",
                    'row': 0
                })
                return False
        
        return True
    
    def _process_rows(self, data_rows):
        """Process each data row and validate"""
        self.total_rows = len(data_rows)
        
        for i, row in enumerate(data_rows, start=2):  # Start at 2 to account for header
            if len(row) == 0 or all(cell.strip() == '' for cell in row):
                continue  # Skip empty rows
                
            processed_row = self._process_single_row(row, i)
            if processed_row:
                self.valid_rows.append(processed_row)
    
    def _process_single_row(self, row, row_number):
        """Process and validate a single CSV row"""
        row_data = {
            'row_number': row_number,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Extract symbol
            symbol_idx = self.column_mapping.get('symbol')
            if symbol_idx is not None and symbol_idx < len(row):
                symbol = row[symbol_idx].strip().upper()
                if symbol:
                    row_data['symbol'] = symbol
                else:
                    row_data['errors'].append("Symbol is required")
            else:
                row_data['errors'].append("Symbol column not found")
            
            # Extract quantity with automatic cleaning
            quantity_idx = self.column_mapping.get('quantity')
            if quantity_idx is not None and quantity_idx < len(row):
                try:
                    # Clean quantity string - remove common formatting
                    quantity_str = row[quantity_idx].strip()
                    # Remove commas, spaces, and common prefixes/suffixes
                    quantity_str = quantity_str.replace(',', '').replace(' ', '')
                    quantity_str = quantity_str.replace('shares', '').replace('qty:', '').replace('qty', '')
                    # Remove any non-numeric characters except decimal point
                    quantity_str = re.sub(r'[^\d.-]', '', quantity_str)
                    
                    if quantity_str:
                        quantity = Decimal(quantity_str)
                        if quantity >= 0:  # Allow 0 quantities
                            row_data['quantity'] = str(quantity)  # Convert to string for JSON serialization
                        else:
                            row_data['errors'].append("Quantity cannot be negative")
                    else:
                        # Default to 0 if no quantity provided
                        row_data['quantity'] = "0"
                        row_data['warnings'].append("No quantity provided, defaulted to 0")
                except (InvalidOperation, ValueError):
                    row_data['errors'].append(f"Could not parse quantity '{row[quantity_idx].strip()}'")
            else:
                # Default to 0 if quantity column not found
                row_data['quantity'] = "0"
                row_data['warnings'].append("Quantity column not found, defaulted to 0")
            
            # Extract purchase price with automatic cleaning
            price_idx = self.column_mapping.get('purchase_price')
            if price_idx is not None and price_idx < len(row):
                try:
                    # Clean price string - remove common formatting
                    price_str = row[price_idx].strip()
                    # Remove currency symbols, commas, spaces, and common prefixes/suffixes
                    price_str = price_str.replace('$', '').replace('€', '').replace('£', '')
                    price_str = price_str.replace(',', '').replace(' ', '')
                    price_str = price_str.replace('USD', '').replace('usd', '')
                    price_str = price_str.replace('price:', '').replace('cost:', '')
                    # Remove any non-numeric characters except decimal point
                    price_str = re.sub(r'[^\d.-]', '', price_str)
                    
                    if price_str:
                        price = Decimal(price_str)
                        if price >= 0:  # Allow 0 prices
                            row_data['purchase_price'] = str(price)  # Convert to string for JSON serialization
                        else:
                            row_data['errors'].append("Purchase price cannot be negative")
                    else:
                        # Default to 0 if no price provided
                        row_data['purchase_price'] = "0"
                        row_data['warnings'].append("No purchase price provided, defaulted to 0")
                except (InvalidOperation, ValueError):
                    row_data['errors'].append(f"Could not parse price '{row[price_idx].strip()}'")
            else:
                # Default to 0 if purchase price column not found
                row_data['purchase_price'] = "0"
                row_data['warnings'].append("Purchase price column not found, defaulted to 0")
            
            # Extract purchase date (optional)
            date_idx = self.column_mapping.get('purchase_date')
            if date_idx is not None and date_idx < len(row) and row[date_idx].strip():
                try:
                    date_str = row[date_idx].strip()
                    # Try different date formats
                    date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']
                    
                    parsed_date = None
                    for fmt in date_formats:
                        try:
                            parsed_date = datetime.strptime(date_str, fmt).date()
                            break
                        except ValueError:
                            continue
                    
                    if parsed_date:
                        row_data['purchase_date'] = parsed_date.isoformat()  # Convert to string for JSON serialization
                    else:
                        row_data['warnings'].append(f"Could not parse date '{date_str}', using today's date")
                        row_data['purchase_date'] = timezone.now().date().isoformat()
                        
                except Exception:
                    row_data['warnings'].append("Invalid date format, using today's date")
                    row_data['purchase_date'] = timezone.now().date().isoformat()
            else:
                # Default to today if no date provided
                row_data['purchase_date'] = timezone.now().date().isoformat()
            
            # Extract notes (optional)
            notes_idx = self.column_mapping.get('notes')
            if notes_idx is not None and notes_idx < len(row):
                notes = row[notes_idx].strip()
                if notes:
                    row_data['notes'] = notes
            
            return row_data
            
        except Exception as e:
            row_data['errors'].append(f"Row processing error: {str(e)}")
            return row_data
    
    def _validate_stock_symbols(self):
        """Validate stock symbols against Yahoo Finance in batch"""
        symbols_to_validate = []
        symbol_to_rows = {}
        
        # Collect unique symbols
        for row in self.valid_rows:
            if 'symbol' in row and not row['errors']:
                symbol = row['symbol']
                if symbol not in symbol_to_rows:
                    symbol_to_rows[symbol] = []
                    symbols_to_validate.append(symbol)
                symbol_to_rows[symbol].append(row)
        
        # Validate symbols
        for symbol in symbols_to_validate:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
                if not info.get('symbol') and not info.get('longName'):
                    # Symbol not found
                    for row in symbol_to_rows[symbol]:
                        row['errors'].append(f"Stock symbol '{symbol}' not found")
                else:
                    # Symbol is valid, store additional info
                    for row in symbol_to_rows[symbol]:
                        row['stock_name'] = info.get('longName', symbol)
                        
            except Exception as e:
                for row in symbol_to_rows[symbol]:
                    row['warnings'].append(f"Could not validate symbol '{symbol}': {str(e)}")
    
    def _update_import_record(self):
        """Update the PortfolioImport record with parsing results"""
        valid_count = sum(1 for row in self.valid_rows if not row.get('errors'))
        error_count = sum(1 for row in self.valid_rows if row.get('errors'))
        
        self.portfolio_import.total_rows = self.total_rows
        self.portfolio_import.successful_imports = valid_count
        self.portfolio_import.failed_imports = error_count
        self.portfolio_import.status = 'preview'
        self.portfolio_import.preview_data = {
            'valid_rows': self.valid_rows,
            'column_mapping': self.column_mapping,
            'total_errors': len(self.errors)
        }
        self.portfolio_import.error_log = self.errors
        self.portfolio_import.save()
    
    def _create_result(self, success=True, error=None):
        """Create standardized result dictionary"""
        return {
            'success': success,
            'error': error,
            'total_rows': self.total_rows,
            'valid_rows': len([r for r in self.valid_rows if not r.get('errors')]),
            'error_rows': len([r for r in self.valid_rows if r.get('errors')]),
            'data': self.valid_rows,
            'errors': self.errors,
            'column_mapping': self.column_mapping
        }


def create_positions_from_import(portfolio_import):
    """
    Create portfolio positions from validated import data
    """
    from .models import Position
    
    if not portfolio_import.preview_data:
        raise ValueError("No preview data available")
    
    valid_rows = portfolio_import.preview_data.get('valid_rows', [])
    created_positions = []
    errors = []
    
    try:
        portfolio_import.status = 'processing'
        portfolio_import.save()
        
        for row_data in valid_rows:
            if row_data.get('errors'):
                continue  # Skip rows with errors
                
            try:
                # Get or create stock
                stock, created = Stock.objects.get_or_create(
                    symbol=row_data['symbol'],
                    defaults={
                        'name': row_data.get('stock_name', row_data['symbol'])
                    }
                )
                
                # Check for existing positions and merge them
                existing_position = Position.objects.filter(
                    portfolio=portfolio_import.portfolio,
                    stock=stock
                ).first()
                
                new_quantity = Decimal(row_data['quantity'])
                new_price = Decimal(row_data['purchase_price'])
                
                if existing_position:
                    # Calculate weighted average cost and sum quantities
                    existing_quantity = existing_position.quantity
                    existing_price = existing_position.purchase_price
                    
                    # Total quantities
                    total_quantity = existing_quantity + new_quantity
                    
                    # Calculate weighted average price
                    if total_quantity > 0:
                        total_cost = (existing_quantity * existing_price) + (new_quantity * new_price)
                        average_price = total_cost / total_quantity
                    else:
                        average_price = Decimal('0')
                    
                    # Update existing position
                    existing_position.quantity = total_quantity
                    existing_position.purchase_price = average_price
                    # Keep the earlier purchase date
                    new_date = datetime.fromisoformat(row_data['purchase_date']).date()
                    if new_date < existing_position.purchase_date:
                        existing_position.purchase_date = new_date
                    existing_position.save()
                    
                    created_positions.append(existing_position)
                    continue
                
                # Create new position - convert string values back to proper types
                purchase_date = datetime.fromisoformat(row_data['purchase_date']).date()
                
                position = Position.objects.create(
                    portfolio=portfolio_import.portfolio,
                    stock=stock,
                    quantity=new_quantity,
                    purchase_price=new_price,
                    purchase_date=purchase_date
                )
                
                created_positions.append(position)
                
            except Exception as e:
                errors.append({
                    'row': row_data['row_number'],
                    'message': f"Failed to create position: {str(e)}"
                })
        
        # Update import status
        portfolio_import.successful_imports = len(created_positions)
        portfolio_import.failed_imports = len(errors)
        portfolio_import.status = 'completed'
        portfolio_import.error_log = errors
        portfolio_import.save()
        
        return {
            'success': True,
            'created_positions': len(created_positions),
            'errors': errors
        }
        
    except Exception as e:
        portfolio_import.status = 'failed'
        portfolio_import.error_log = [{'message': str(e)}]
        portfolio_import.save()
        
        return {
            'success': False,
            'error': str(e),
            'created_positions': len(created_positions),
            'errors': errors
        }