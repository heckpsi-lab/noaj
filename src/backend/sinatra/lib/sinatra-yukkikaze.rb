class Ykk
  def self.version
    Gem.loaded_specs['sinatra-yukkikaze'].version.to_s
  end
end